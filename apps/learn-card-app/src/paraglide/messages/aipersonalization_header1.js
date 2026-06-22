/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Header1Inputs */

const en_aipersonalization_header1 = /** @type {((inputs: Aipersonalization_Header1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Header1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Personalize my AI Sessions`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Personalize my " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "AI Sessions" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_aipersonalization_header1 = /** @type {((inputs: Aipersonalization_Header1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Header1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Personaliza mis Sesiones de IA`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Personaliza mis " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Sesiones de IA" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_aipersonalization_header1 = /** @type {((inputs: Aipersonalization_Header1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Header1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Personnalisez mes Sessions IA`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Personnalisez mes " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Sessions IA" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_aipersonalization_header1 = /** @type {((inputs: Aipersonalization_Header1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Header1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`خصّص جلسات الذكاء الاصطناعي الخاصة بي`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Header1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "خصّص " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "جلسات الذكاء الاصطناعي" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " الخاصة بي" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Personalize my AI Sessions" |
*
* @param {Aipersonalization_Header1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_header1 = /** @type {((inputs?: Aipersonalization_Header1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aipersonalization_Header1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aipersonalization_Header1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aipersonalization_Header1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aipersonalization_header1(inputs)
			if (locale === "es") return es_aipersonalization_header1(inputs)
			if (locale === "fr") return fr_aipersonalization_header1(inputs)
			return ar_aipersonalization_header1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aipersonalization_Header1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aipersonalization_header1.parts === "function" ? en_aipersonalization_header1.parts(inputs) : [{ type: "text", value: en_aipersonalization_header1(inputs) }]
				if (locale === "es") return typeof es_aipersonalization_header1.parts === "function" ? es_aipersonalization_header1.parts(inputs) : [{ type: "text", value: es_aipersonalization_header1(inputs) }]
				if (locale === "fr") return typeof fr_aipersonalization_header1.parts === "function" ? fr_aipersonalization_header1.parts(inputs) : [{ type: "text", value: fr_aipersonalization_header1(inputs) }]
				return typeof ar_aipersonalization_header1.parts === "function" ? ar_aipersonalization_header1.parts(inputs) : [{ type: "text", value: ar_aipersonalization_header1(inputs) }]
			})
		}
	)
);
export { aipersonalization_header1 as "aiPersonalization.header" }