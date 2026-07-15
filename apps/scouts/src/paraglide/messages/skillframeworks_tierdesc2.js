/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Tierdesc2Inputs */

const en_skillframeworks_tierdesc2 = /** @type {((inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`A framework tier serves as a structural container for competencies.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "A " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "framework tier" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " serves as a structural container for competencies." }])
			})
		}
	)
);

const es_skillframeworks_tierdesc2 = /** @type {((inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Un nivel de marco sirve como contenedor estructural para competencias.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Un " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "nivel de marco" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " sirve como contenedor estructural para competencias." }])
			})
		}
	)
);

const fr_skillframeworks_tierdesc2 = /** @type {((inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Un niveau de cadre sert de conteneur structurel pour les compétences.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Un " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "niveau de cadre" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " sert de conteneur structurel pour les compétences." }])
			})
		}
	)
);

const ar_skillframeworks_tierdesc2 = /** @type {((inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`A framework tier serves as a structural container for competencies.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Tierdesc2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "A " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "framework tier" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " serves as a structural container for competencies." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "A framework tier serves as a structural container for competencies." |
*
* @param {Skillframeworks_Tierdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_tierdesc2 = /** @type {((inputs?: Skillframeworks_Tierdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Skillframeworks_Tierdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skillframeworks_Tierdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Skillframeworks_Tierdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skillframeworks_tierdesc2(inputs)
			if (locale === "es") return es_skillframeworks_tierdesc2(inputs)
			if (locale === "fr") return fr_skillframeworks_tierdesc2(inputs)
			return ar_skillframeworks_tierdesc2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Skillframeworks_Tierdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skillframeworks_tierdesc2.parts === "function" ? en_skillframeworks_tierdesc2.parts(inputs) : [{ type: "text", value: en_skillframeworks_tierdesc2(inputs) }]
				if (locale === "es") return typeof es_skillframeworks_tierdesc2.parts === "function" ? es_skillframeworks_tierdesc2.parts(inputs) : [{ type: "text", value: es_skillframeworks_tierdesc2(inputs) }]
				if (locale === "fr") return typeof fr_skillframeworks_tierdesc2.parts === "function" ? fr_skillframeworks_tierdesc2.parts(inputs) : [{ type: "text", value: fr_skillframeworks_tierdesc2(inputs) }]
				return typeof ar_skillframeworks_tierdesc2.parts === "function" ? ar_skillframeworks_tierdesc2.parts(inputs) : [{ type: "text", value: ar_skillframeworks_tierdesc2(inputs) }]
			})
		}
	)
);
export { skillframeworks_tierdesc2 as "skillFrameworks.tierDesc" }