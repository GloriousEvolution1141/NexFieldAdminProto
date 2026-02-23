export function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
    return new ReadableStream({
        start(controller) {
            nodeStream.on("data", (chunk) => {
                controller.enqueue(chunk);
            });
            nodeStream.on("end", () => {
                controller.close();
            });
            nodeStream.on("error", (err) => {
                controller.error(err);
            });
        },
        cancel() {
            // Optional: Handle stream cancellation
            if (typeof (nodeStream as any).destroy === "function") {
                (nodeStream as any).destroy();
            }
        },
    });
}
