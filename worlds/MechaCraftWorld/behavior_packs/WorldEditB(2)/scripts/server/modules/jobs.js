import { Server, RawText, contentLog } from "./../../library/Minecraft.js";
import { addTickingArea, removeTickingArea } from "server/util";
// eslint-disable-next-line prefer-const
let jobId = 0;
class JobHandler {
    constructor() {
        this.jobs = new Map();
        Server.on("tick", () => {
            this.printJobs();
        });
    }
    startJob(session, steps, area) {
        const areaName = "wedit:job_" + jobId;
        if (!area || addTickingArea(areaName, session.getPlayer().dimension, ...area)) {
            contentLog.warn("A ticking area could not be created for job #", jobId);
        }
        this.jobs.set(++jobId, {
            stepCount: steps,
            step: -1,
            player: session.getPlayer(),
            message: "",
            percent: 0,
            area: areaName,
            dimension: session.getPlayer().dimension
        });
        return jobId;
    }
    nextStep(jobId, message) {
        if (this.jobs.has(jobId)) {
            const job = this.jobs.get(jobId);
            job.step++;
            job.percent = 0;
            job.message = message;
        }
    }
    setProgress(jobId, percent) {
        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId).percent = Math.max(Math.min(percent, 1), 0);
        }
    }
    *perform(jobId, func, finishOnError = true) {
        let val;
        let lastPromise;
        while (!val?.done) {
            try {
                val = func.next(lastPromise);
                lastPromise = undefined;
                if (typeof val.value == "number") {
                    this.setProgress(jobId, val.value);
                }
                else if (typeof val.value == "string") {
                    this.nextStep(jobId, val.value);
                }
                else if (val.value instanceof Promise) {
                    lastPromise = yield val.value;
                }
            }
            catch (err) {
                if (finishOnError) {
                    this.finishJob(jobId);
                }
                throw err;
            }
            yield;
        }
        return val.value;
    }
    finishJob(jobId) {
        if (this.jobs.has(jobId)) {
            const job = this.jobs.get(jobId);
            job.percent = 1;
            job.step = job.stepCount - 1;
            job.message = "Finished!"; // TODO: Localize
            removeTickingArea(job.area, job.dimension);
            this.printJobs();
            this.jobs.delete(jobId);
        }
    }
    printJobs() {
        const progresses = new Map();
        for (const job of this.jobs.values()) {
            if (!progresses.has(job.player)) {
                progresses.set(job.player, []);
            }
            const percent = (job.percent + job.step) / job.stepCount;
            progresses.get(job.player).push([job.message, Math.max(percent, 0)]);
        }
        for (const [player, progress] of progresses.entries()) {
            let text;
            let i = 0;
            for (const [message, percent] of progress) {
                if (text) {
                    text.append("text", "\n");
                }
                let bar = "";
                for (let i = 0; i < 20; i++) {
                    bar += i / 20 <= percent ? "█" : "▒";
                }
                if (!text) {
                    text = new RawText();
                }
                if (progress.length > 1) {
                    text.append("text", `Job ${++i}: `);
                }
                text.append("translate", message).append("text", `\n${bar} ${(percent * 100).toFixed(2)}%`);
            }
            Server.queueCommand(`titleraw @s actionbar ${text.toString()}`, player);
        }
    }
}
export const Jobs = new JobHandler();
