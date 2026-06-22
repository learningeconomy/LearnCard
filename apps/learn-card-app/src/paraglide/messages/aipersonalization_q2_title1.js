/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q2_Title1Inputs */

const en_aipersonalization_q2_title1 = /** @type {((inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`My favorite fictional characters are`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "My favorite " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "fictional characters" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " are" }])
			})
		}
	)
);

const es_aipersonalization_q2_title1 = /** @type {((inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Mis personajes ficticios favoritos son`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Mis " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "personajes ficticios" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " favoritos son" }])
			})
		}
	)
);

const fr_aipersonalization_q2_title1 = /** @type {((inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Mes personnages de fiction préférés sont`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Mes " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "personnages de fiction" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " préférés sont" }])
			})
		}
	)
);

const ar_aipersonalization_q2_title1 = /** @type {((inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`الشخصيات الخيالية المفضلة لدي هي`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q2_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "الشخصيات الخيالية" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " المفضلة لدي هي" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "My favorite fictional characters are" |
*
* @param {Aipersonalization_Q2_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q2_title1 = /** @type {((inputs?: Aipersonalization_Q2_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aipersonalization_Q2_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aipersonalization_Q2_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aipersonalization_Q2_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aipersonalization_q2_title1(inputs)
			if (locale === "es") return es_aipersonalization_q2_title1(inputs)
			if (locale === "fr") return fr_aipersonalization_q2_title1(inputs)
			return ar_aipersonalization_q2_title1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aipersonalization_Q2_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aipersonalization_q2_title1.parts === "function" ? en_aipersonalization_q2_title1.parts(inputs) : [{ type: "text", value: en_aipersonalization_q2_title1(inputs) }]
				if (locale === "es") return typeof es_aipersonalization_q2_title1.parts === "function" ? es_aipersonalization_q2_title1.parts(inputs) : [{ type: "text", value: es_aipersonalization_q2_title1(inputs) }]
				if (locale === "fr") return typeof fr_aipersonalization_q2_title1.parts === "function" ? fr_aipersonalization_q2_title1.parts(inputs) : [{ type: "text", value: fr_aipersonalization_q2_title1(inputs) }]
				return typeof ar_aipersonalization_q2_title1.parts === "function" ? ar_aipersonalization_q2_title1.parts(inputs) : [{ type: "text", value: ar_aipersonalization_q2_title1(inputs) }]
			})
		}
	)
);
export { aipersonalization_q2_title1 as "aiPersonalization.q2.title" }