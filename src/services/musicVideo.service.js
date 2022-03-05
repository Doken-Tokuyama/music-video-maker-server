const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");

const self = (module.exports = {
    getVideoID: (videoLink) => {
        try {
            const videoID = ytdl.getURLVideoID(videoLink);
            return videoID;
        } catch (error) {
            console.log(error);
        }
    },
    getVideoInfo: async (videoID) => {
        try {
            return await ytdl.getBasicInfo(videoID);
        } catch (error) {
            console.log(error);
        }
    },
    getVideoDuration: (videoPath) => {
        try {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(videoPath, (err, metadata) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(metadata.format.duration);
                    }
                });
            });
        } catch (error) {
            console.log(error);
        }
    },
    downloadFromYoutube: (videoID, startAtSeconds) => {
        try {
            return new Promise((resolve, reject) => {
                const outputPath = path.resolve(
                    __dirname,
                    `../../temp/${videoID}.mp4`
                );
                ytdl(`http://www.youtube.com/watch?v=${videoID}`, {
                    begin: startAtSeconds,
                })
                    .pipe(fs.createWriteStream(outputPath))
                    .on("finish", () => {
                        resolve(outputPath);
                    })
                    .on("error", (err) => {
                        reject(err);
                    });
            });
        } catch (error) {
            console.log(error);
        }
    },
    processVideo: (
        videoPath,
        outputPath,
        {
            startAt = 0,
            endAt,
            width = 1080,
            height = 1920,
            background = "#000000",
        }
    ) => {
        try {
            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .setStartTime(startAt)
                    .setDuration(endAt - startAt)
                    .size(`${width}x${height}`)
                    .autopad(true, background)
                    .output(outputPath)
                    .on("end", () => {
                        fs.unlink(videoPath, () => {});
                        resolve(outputPath);
                    })
                    .on("error", (err) => {
                        fs.unlink(videoPath, () => {});
                        reject(err);
                    })
                    .run();
            });
        } catch (error) {
            console.log(error);
        }
    },
    addWatermark: async (videoPath, watermarkPath, outputPath) => {
        try {
            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .input(watermarkPath)
                    .output(outputPath)
                    .complexFilter([
                        "overlay=x=(main_w-overlay_w)/2:y=1920-500",
                    ])
                    .on("end", () => {
                        resolve(outputPath);
                    })
                    .on("error", (err) => {
                        reject(err);
                    })
                    .run();
            });
        } catch (error) {
            console.log(error);
        }
    },
});
