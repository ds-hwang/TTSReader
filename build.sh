mkdir TTSReader
cp -r css/ images/ js/ _locales/ manifest.json options.html popup.html README.md tts_reader.html TTSReader/
zip -r TTSReader.zip TTSReader/
rm -rf TTSReader 
