/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Aidesc1Inputs */

const en_skills_aidesc1 = /** @type {((inputs: Skills_Aidesc1Inputs) => LocalizedString) & { parts: (inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Aidesc1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your top skills, learning snapshots, suggested lessons & careers, and TEDed content.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Your" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " top skills, learning snapshots, suggested lessons & careers, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "and" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " TEDed content." }])
			})
		}
	)
);

const es_skills_aidesc1 = /** @type {((inputs: Skills_Aidesc1Inputs) => LocalizedString) & { parts: (inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Aidesc1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tus mejores habilidades, instantáneas de aprendizaje, lecciones y carreras sugeridas, y contenido TEDed.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Tus" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " mejores habilidades, instantáneas de aprendizaje, lecciones y carreras sugeridas, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "y" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " contenido TEDed." }])
			})
		}
	)
);

const fr_skills_aidesc1 = /** @type {((inputs: Skills_Aidesc1Inputs) => LocalizedString) & { parts: (inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Aidesc1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Vos meilleures compétences, instantanés d'apprentissage, leçons et carrières suggérées, et contenu TEDed.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Vos" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " meilleures compétences, instantanés d'apprentissage, leçons et carrières suggérées, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "et" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " contenu TEDed." }])
			})
		}
	)
);

const ar_skills_aidesc1 = /** @type {((inputs: Skills_Aidesc1Inputs) => LocalizedString) & { parts: (inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Aidesc1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your top skills, learning snapshots, suggested lessons & careers, and TEDed content.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Aidesc1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Your" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " top skills, learning snapshots, suggested lessons & careers, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "and" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " TEDed content." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your top skills, learning snapshots, suggested lessons & careers, and TEDed content." |
*
* @param {Skills_Aidesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_aidesc1 = /** @type {((inputs?: Skills_Aidesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Skills_Aidesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skills_Aidesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Skills_Aidesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skills_aidesc1(inputs)
			if (locale === "es") return es_skills_aidesc1(inputs)
			if (locale === "fr") return fr_skills_aidesc1(inputs)
			return ar_skills_aidesc1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Skills_Aidesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skills_aidesc1.parts === "function" ? en_skills_aidesc1.parts(inputs) : [{ type: "text", value: en_skills_aidesc1(inputs) }]
				if (locale === "es") return typeof es_skills_aidesc1.parts === "function" ? es_skills_aidesc1.parts(inputs) : [{ type: "text", value: es_skills_aidesc1(inputs) }]
				if (locale === "fr") return typeof fr_skills_aidesc1.parts === "function" ? fr_skills_aidesc1.parts(inputs) : [{ type: "text", value: fr_skills_aidesc1(inputs) }]
				return typeof ar_skills_aidesc1.parts === "function" ? ar_skills_aidesc1.parts(inputs) : [{ type: "text", value: ar_skills_aidesc1(inputs) }]
			})
		}
	)
);
export { skills_aidesc1 as "skills.aiDesc" }