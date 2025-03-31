+++
title = '🐋 Docker Audio Error'
date = 2025-03-13T18:24:55-05:00
+++

## What I'm Working On
I've recently been working on a simple API called [Tiny Sound Box](https://github.com/john-pettigrew/tiny-sound-box) to play local sound files in my homelab. The idea being that Home Assistant or any other app I have deployed can play notifications to me out loud. Plus, by using the [wyoming-cli](https://github.com/john-pettigrew/wyoming-cli) app I discussed in [a previous post](/posts/wyoming-2/), I can create custom spoken notification messages. For example, I could have a "*now on battery backup*" message play when the power goes out and I switch to my UPS backup. 

I usually like to deploy applications in containers, specifically using Docker. I was testing out the new app and everything seemed to be working perfectly so I started setting up the image. The app would start normally without any issues, but when I went to actually play audio using the "aplay" command no sound would play and I was only getting an error message.

## The Error
This is the error I kept seeing: 
```
ALSA lib pcm_dmix.c:1000:(snd_pcm_dmix_open) unable to open slave
```

I made sure that I was passing the audio device when starting the docker container using:
```
--device /dev/snd
```

But the error persisted. From what I could tell, the problem was that I needed to specify the audio output I needed, since my system had several available outputs.

## My First Attempt At a Solution
After some searching, I saw there were two solutions. One was to pass the target audio output device to the aplay command. The other was to create an "asound.conf" file to mount in the container. I assumed solution #1 would be easier so I started down that route and modified my Go app to pass a user defined string to the aplay command.

First, I needed to get the audio card and device indexes from this command:

```bash
aplay -l
```

Then once you pick which audio device you want to use, you just have to pass the chosen card number and device number to the "aplay" command. For instance, to use the 1st card and 7th device, you can specify like this:
```bash
aplay -D hw:1,7 ./hello.wav
```

This caused some weird issues for me however. At first, some of the audio files weren't playing at the correct speed. I found a solution to that by changing the "hw" part of the command to something else. But then, I realized that anytime a sound was playing, it would block any other sounds from playing and output an error since I was specifying the specific device to use. For this app, one of the main abilities is to play multiple sounds at once, so that wasn't going to work. I assume there is a way to fix that as well. But, at this point I was ready to try solution #2.

## My final solution
In the end, I just had to write a small "asound.conf" file specifying the output device and defining how to "share" the output device:
```
pcm.myaudio {
    type dmix
    ipc_key 1024
    slave.pcm "hw:1,7"
}
pcm.!default {
    type plug
    slave.pcm "myaudio"
}
```
Here, I'm setting the default output to be the "myaudio" output which specifies the card and device to be shared.


Then I could mount the file in my Docker container without an issue:
```bash
-v ./asound.conf:/etc/asound.conf:ro
```
And then I had working audio in my container!

## Wrapping Up
This was a shorter post, but hopefully it helps someone else searching for this error message like I was.

Until next time!