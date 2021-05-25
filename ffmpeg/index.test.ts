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

await test()