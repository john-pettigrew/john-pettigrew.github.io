+++
title = '🙉 Wyoming 2 - speak up'
date = 2024-12-02T14:56:38-06:00
+++

## Last time...
In my previous post I discussed creating a client for the Wyoming Protocol called [wyoming-cli](https://github.com/john-pettigrew/wyoming-cli) that could request spoken audio to be generated from text. I decided to continue working on this project and add what I think is the next logical piece of functionality, ASR or automatic speech recognition. This means I should be able to provide either audio data from a microphone or from an audio file and have the speech transcribed. As a bonus since these servers are typically used for talking to smart assistants, getting a response doesn't take very long.

Fortunately for me I naively thought this would be an easy task. My thinking was, I would primarily need to reverse the functionality I wrote in the previous post. So instead of collecting audio from a Wyoming server, I would just need to send it to a Wyoming server. As it turns out, there ending up being a few interesting problems I hadn't considered. 


## WAV files
In that previous post I explained how I was able to write PCM audio to disk as a WAV file. I created an array with the required individual fields for the WAV file header and wrote each to the file in order. For ASR, I instead needed to _read_ that data from a file. I mainly needed the audio rate, channels, bits per sample, and of course the actual audio data. I first assumed I could just read those specific values from the same byte offsets I used when generating a WAV file. Turns out, no. WAV files can contain different header sections depending on how they were created. So when using byte offsets, I was able to parse the WAV files created with [wyoming-cli](https://github.com/john-pettigrew/wyoming-cli), but couldn't parse any other WAV files. 

Luckily each header section first has a fixed length identifier and then a count of the number of bytes for the rest of the section. So, all I had to do was first parse the main WAV header, and then I could just loop through any other sub-sections looking for the data I needed. For example, the "fmt " section contains information on how to play the audio. Finally, it loops until it sees a "data" section. This is where the actual audio is contained.

```go
type WAVHeaderField struct {
    Value         []byte
    RequiredValue []byte
    Offset        int64
}
```

```go
fmtFields := map[string]WAVHeaderField{
	"format": {
		Value:         make([]byte, 2),
		RequiredValue: []byte{0x01, 0x00},
		Offset:        0,
	},
	"channels": {
		Value:  make([]byte, 2),
		Offset: 2,
	},
	"sampleRate": {
		Value:  make([]byte, 4),
		Offset: 4,
	},
	...
}
```
 I store each value I'm looking for in a "Value" byte array. Each field has a local section "Offset" so that they can be read from the file in any order and still referenced by name in the map afterwards. Lastly, there's an optional "RequiredValue" byte array. If set, this is compared to the previously read "Value" and an error is returned if they don't match. This makes it really easy to add validation. For example, having a "RequiredValue" of "{0x01, 0x00}" for the "format" field makes sure that the file contains _PCM_ audio data.


## When to stop listening
I could send my test audio WAV file to a Wyoming server running Whisper and actual see the text I was expecting. The only problem now was, I was seeing _all_ of the text at once. For really short audio files, this is fine. But if you have a really long audio file, then its really nice to have timestamps for the audio events. Also, one of my requirements was to be able to read the audio data from the user's microphone. I could have waited a set number of seconds or waited until the program was exiting to try and request a transcription, but I didn't feel like either of these would have been the greatest UX. 

Luckily, its not too difficult to determine when an audio event is occuring. PCM audio contains number representations of the audio signal. So one can look at a small window of time, like 50ms for example, and compare the largest value read to the smallest. If the difference is above some threshold, then there was likely noise in that sample. If its below, then its likely just background noise. After implementing that, it was just a matter of keeping track of when the events happened and making sure the initial noise event was included with the transcription request being sent.

## It was just working
One strange thing I noticed was that the Wyoming Whisper server I was using would respond to several messages without issue, but would stop responding to any new requests after a transcription result. I'm still not 100% sure why this is the case, but my fix was to just create a new connection for each transcription needed. I initially envisioned having one shared connection that could be reused. But not having a shared connection also greatly simplified the case where multiple transcriptions are being requested at once since each request can just listen for its own response.

## Timing
Speaking of multiple responses at once, I designed [wyoming-cli](https://github.com/john-pettigrew/wyoming-cli) initially to only request one transcription at a time. Once an audio event was detected, it would start the request for a transcription. For testing, I was using my local CPU instead of a GPU to run the Whisper server and it takes a bit more time to get a response. That made it really obvious that during this waiting time, any new audio events from the microphone would be ignored.

So to fix that, I updated it so that the audio event detection would run on its own goroutine as would each transcription request using a pool of workers. I could have created a new goroutine for _every_ transcription request but one benefit of using a pool of workers is that it helps to make sure that the server doesn't get overwhelmed by a single client with lots of requests.

## Does it work
It works! I was even able to write parts of this post using my voice. And now, I have a really conveinient way to get transcriptions for some of the projects I'm working on.

```shell
wyoming-cli asr --input_file './hello.wav'
```

Until next time!