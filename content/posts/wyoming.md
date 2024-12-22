+++
title = '🦬 Wyoming In Go'
date = 2024-11-08T13:20:23-06:00
+++

## The Setup

I was working on a side project the other day and I needed to generate some spoken audio from generated text. This is called "Text to Speech" or "TTS". There's also "Speech to Text" or STT, and a few other acronyms to memorize for fun. 

I'm a huge fan of Home Assistant and last year they had several updates for their "Year of the Voice". These updates gave the project functionality like those home smart speakers that were super popular for a while. One benefit of having this in Home Assistant is privacy! All your requests to "turn off the kitchen light" will be safely stored away from prying eyes, on a server you trust.

These updates connect Home Assistant to servers running the [*Wyoming Protocol*](https://github.com/rhasspy/wyoming) (More details below). I say servers (plural) because the different pieces (TTS, STT, etc.) run separately. Which is great so you aren't having to run a bunch of AI models that you don't really need. The TTS server I'm using is called [Piper](https://github.com/rhasspy/wyoming-piper). The only problem is that since these servers use that Wyoming protocol and aren't normal web servers, you can't just use normal HTTP to request data.


## One Problem - Several Solutions
For my project, I want a simple command where I can have text as an input and output an audio file. One solution here would be to just write a python script to run the Piper AI model locally instead. This would work, but I would be potentially loading the same models into memory multiple times. Plus, I've been enjoying writing more code with Go lately. Another great thing about connecting to a remote server instead is that I can just use my running Piper instance that Home Assistant is using for any future projects. Plus, I'll also have a small library in Go for talking over Wyoming that I can use later. So, I decided to create [wyoming-cli](https://github.com/john-pettigrew/wyoming-cli)!

## Wyoming (The Protocol)
Overall, the Wyoming protocol is pretty simple. After you connect over TCP, data is structured like [jsonl](https://jsonlines.org/). Which means JSON with newline characters after each message. But, Wyoming can also send PCM audio data.

The data being sent is structured like this: first a "message" json string is sent followed by a newline character. Then, an optional "data" json string and an optional "payload" that usually contains PCM audio, is sent. Then the pattern repeats if there are multiple messages.

So it ends up looking kind of like this:
```
{json message}\n
{optional data}[optional payload]{json message}\n
...
{optional data}[optional payload]{json message}\n
```

Reading and parsing the initial message is easy since you just need to read from the TCP connection until that `'\n'` newline character is seen.

Here's an example of what that message might look like:

```json
{
    "type": "synthesize",
    "data": {
        "text": "Hello World"
    }
}
```
The "type" field describes what type of message is actually being sent. It can either be a request or a response message. "synthesize" is a request for piper to start generating audio.

The message also has a "data_length" and a "payload_length" field which are the number of bytes that are to follow for each. Here is an example of what the message sent for some audio data might look like:

```json
{
    "type": "audio-chunk",
    "data_length": 42,
    "payload_length": 1024,
    "data": {
        "rate": 22050,
        "width": 2,
        "channels": 1
    }
}
```

The "data" field in this example contains metadata about the audio like the audio rate, width, and number of channels. This is important since it actually describes _how_ to play the audio. This is also needed if you want to later convert that PCM audio into something more typical like "wav" or "mp3". However, this "data" field is not the same as the "data" referenced by "data_length" and sent after the message. So be careful to not mix those up like I did.

Finally, the optional payload is sent. If you are generating audio with Piper, this is the actual PCM audio.
Audio being sent will start with an "audio-start" message type to signal some audio is going to be sent. Then multiple "audio-chunk" messages are sent with the actual audio. Finally, an "audio-stop" message is sent to signal that all of the audio was sent. 
```
[audio-start]
[audio-chunk]
...
[audio-chunk]
[audio-stop]
```

## Outputs
To more closely match the existing [Piper](https://github.com/rhasspy/piper) options, wyoming-cli can output to a WAV file with "--output_file" or output the raw PCM audio to be played immediately using something like "aplay" with the "--output-raw" option.

## Converting Audio
I had a lot of this blog post written and the code done when something started to bug me. The Wyoming server will send the actual audio data as PCM audio. This makes it easy to immediately start playing. But, if you want to save the file for later, then you'll likely want to convert it to a more common audio format (like WAV). When I initially wrote the code for this project, I used "ffmpeg" to convert the audio:
```go
...
// convert
cmd := exec.Command(
    "ffmpeg",
    "-f", "s16le",
    "-ar", strconv.Itoa(rate),
    "-ac", strconv.Itoa(channels),
    "-i", PCMFilePath,
    outputWavFilePath,
)
...
    
```
Now, this is _fine_. But one of the cool parts about writing in Go is that I can compile a project and just need the compiled binary to actually run it. Unfortunately here, I would also need to make sure that "ffmpeg" is on the system too. 
It turns out, converting PCM audio to a WAV file is actually pretty simple. You can think of a WAV file as a container for data. To create one, you just need to write a header describing the data and then you can append all of the PCM audio after that.
```go

WAVHeaderFields := []any{
    // RIFF
    []byte("RIFF"),                 // Chunk ID
    int32(36 + PCMFileStat.Size()), // Chunk Size
    []byte("WAVE"),                 // Format

    // fmt
    []byte("fmt "),       // Subchunk1 ID
    int32(16),            // Subchunk1 Size
    int16(1),             // AudioFormat (PCM)
    int16(channels),      // Num Channels
    int32(rate),          // Sample Rate
    int32(byteRate),      // Byte Rate
    int16(blockAlign),    // Block Align
    int16(bitsPerSample), // Bits Per Sample

    // data
    []byte("data"),            // Subchunk2 ID
    int32(PCMFileStat.Size()), // Subchunk2 Size
}

for _, field := range WAVHeaderFields {
    err = binary.Write(outputFile, binary.LittleEndian, field)
    if err != nil {
        return err
    }
}
```

The header is broken up into 3 sections here. The "RIFF" section is the main header section and contains the size of the full header + audio data (minus 8 bytes for the "Chunk ID" and "Chunk Size"). Following that, there is a "fmt " section that describes how to play the audio and a "data" section that contains the length of the data that follows.

## Results
Now I can just run this command to generate audio for my project:
```shell
    wyoming-cli tts -addr 'my_piper_server:10200' -text 'Hello world' --output_file './hello.wav'
```
or run this to stream the audio directly to my speakers:
```shell
    wyoming-cli tts -addr 'my_piper_server:10200' -text 'Hello world' --output-raw | aplay -r 22050 -f S16_LE -t raw -
```
Without needing to run another instance of Piper. Mission accomplished!

This was definitely a fun project, and I'm planning to build functionality for talking with other Wyoming services like "STT". Feel free to try out [wyoming-cli](https://github.com/john-pettigrew/wyoming-cli) on my Github. Definitely expect some bugs and if you see any please open an issue!

Until Next time!