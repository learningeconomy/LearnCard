/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Compdesc2Inputs */

const en_skillframeworks_compdesc2 = /** @type {((inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`A competency is a verified credential that can be awarded and earned.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "A " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "competency" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " is a verified credential that can be awarded and earned." }])
			})
		}
	)
);

const es_skillframeworks_compdesc2 = /** @type {((inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Una competencia es una credencial verificable que se puede otorgar y obtener.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Una " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "competencia" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " es una credencial verificable que se puede otorgar y obtener." }])
			})
		}
	)
);

const fr_skillframeworks_compdesc2 = /** @type {((inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Une compétence est un justificatif vérifiable qui peut être attribué et obtenu.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Une " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "compétence" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " est un justificatif vérifiable qui peut être attribué et obtenu." }])
			})
		}
	)
);

const ar_skillframeworks_compdesc2 = /** @type {((inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Compdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`A competency is a verified credential that can be awarded and earned.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Compdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "A " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "competency" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " is a verified credential that can be awarded and earned." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "A competency is a verified credential that can be awarded and earned." |
*
* @param {Skillframeworks_Compdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_compdesc2 = /** @type {((inputs?: Skillframeworks_Compdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Skillframeworks_Compdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skillframeworks_Compdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Skillframeworks_Compdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skillframeworks_compdesc2(inputs)
			if (locale === "es") return es_skillframeworks_compdesc2(inputs)
			if (locale === "fr") return fr_skillframeworks_compdesc2(inputs)
			return ar_skillframeworks_compdesc2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Skillframeworks_Compdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skillframeworks_compdesc2.parts === "function" ? en_skillframeworks_compdesc2.parts(inputs) : [{ type: "text", value: en_skillframeworks_compdesc2(inputs) }]
				if (locale === "es") return typeof es_skillframeworks_compdesc2.parts === "function" ? es_skillframeworks_compdesc2.parts(inputs) : [{ type: "text", value: es_skillframeworks_compdesc2(inputs) }]
				if (locale === "fr") return typeof fr_skillframeworks_compdesc2.parts === "function" ? fr_skillframeworks_compdesc2.parts(inputs) : [{ type: "text", value: fr_skillframeworks_compdesc2(inputs) }]
				return typeof ar_skillframeworks_compdesc2.parts === "function" ? ar_skillframeworks_compdesc2.parts(inputs) : [{ type: "text", value: ar_skillframeworks_compdesc2(inputs) }]
			})
		}
	)
);
export { skillframeworks_compdesc2 as "skillFrameworks.compDesc" }