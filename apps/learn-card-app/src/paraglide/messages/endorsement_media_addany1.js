/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_Addany1Inputs */

const en_endorsement_media_addany1 = /** @type {((inputs: Endorsement_Media_Addany1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Media_Addany1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Add any links, images, videos, or documents that support your endorsement.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Add any " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "links, images, videos," }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " or " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "documents" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " that support your endorsement." }])
			})
		}
	)
);

const es_endorsement_media_addany1 = /** @type {((inputs: Endorsement_Media_Addany1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Media_Addany1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Añade cualquier enlace, imagen, video o documento que respalde tu aval.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Añade cualquier " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "enlace, imagen, video" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " o " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "documento" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " que respalde tu aval." }])
			})
		}
	)
);

const fr_endorsement_media_addany1 = /** @type {((inputs: Endorsement_Media_Addany1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Media_Addany1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Ajoutez tout lien, image, vidéo ou document qui appuie votre recommandation.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Ajoutez tout " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "lien, image, vidéo" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ou " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "document" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " qui appuie votre recommandation." }])
			})
		}
	)
);

const ar_endorsement_media_addany1 = /** @type {((inputs: Endorsement_Media_Addany1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Media_Addany1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`أضف أي روابط أو صور أو مقاطع فيديو أو مستندات تدعم توصيتك.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Media_Addany1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أضف أي " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "روابط أو صور أو مقاطع فيديو" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " أو " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "مستندات" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " تدعم توصيتك." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Add any links, images, videos, or documents that support your endorsement." |
*
* @param {Endorsement_Media_Addany1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_addany1 = /** @type {((inputs?: Endorsement_Media_Addany1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Endorsement_Media_Addany1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Endorsement_Media_Addany1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Endorsement_Media_Addany1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_endorsement_media_addany1(inputs)
			if (locale === "es") return es_endorsement_media_addany1(inputs)
			if (locale === "fr") return fr_endorsement_media_addany1(inputs)
			return ar_endorsement_media_addany1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Endorsement_Media_Addany1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_endorsement_media_addany1.parts === "function" ? en_endorsement_media_addany1.parts(inputs) : [{ type: "text", value: en_endorsement_media_addany1(inputs) }]
				if (locale === "es") return typeof es_endorsement_media_addany1.parts === "function" ? es_endorsement_media_addany1.parts(inputs) : [{ type: "text", value: es_endorsement_media_addany1(inputs) }]
				if (locale === "fr") return typeof fr_endorsement_media_addany1.parts === "function" ? fr_endorsement_media_addany1.parts(inputs) : [{ type: "text", value: fr_endorsement_media_addany1(inputs) }]
				return typeof ar_endorsement_media_addany1.parts === "function" ? ar_endorsement_media_addany1.parts(inputs) : [{ type: "text", value: ar_endorsement_media_addany1(inputs) }]
			})
		}
	)
);
export { endorsement_media_addany1 as "endorsement.media.addAny" }