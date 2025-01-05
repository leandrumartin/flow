import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

env.allowLocalModels = false;

/**
 * Class to handle the extraction of embeddings from a track.
 */
export default class EmbeddingExtractor {
    static #instance = null;

    static async getInstance() {
        if (EmbeddingExtractor.#instance === null) {
            EmbeddingExtractor.#instance = pipeline("feature-extraction", "Xenova/jina-embeddings-v2-small-en",); // Using this model because it's relatively small at ~32M params
        }
        return EmbeddingExtractor.#instance;
    }
}
