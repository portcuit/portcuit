import {readFile, writeFile} from 'fs/promises'
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg'
import {config} from 'dotenv'

config()

const test = async () => {
  const ffmpeg = createFFmpeg({log: true});
  await ffmpeg.load();

  // ffmpeg.FS('writeFile', '171.mp4', await fetchFile(`${process.env.AUDIO_DIR}/171.mp4`))
  ffmpeg.FS('writeFile', '171.mp4', await readFile(`${process.env.AUDIO_DIR}/171.mp4`))

  const res = await ffmpeg.run('-i', '171.mp4', '171.flac');
  console.log({res});
  await writeFile(`/tmp/171.flac`, ffmpeg.FS('readFile', '171.flac'))

}

// const test = async () => {
//   const ffmpeg = createFFmpeg({log: true})
//   await ffmpeg.load();

//   ffmpeg.run('-i', 'https://nhks-vh.akamaihd.net/i/gogaku-stream/mp4/21-er-4235-138.mp4/master.m3u8', '-c', 'copy', '003.mp4')
// }

// await test()