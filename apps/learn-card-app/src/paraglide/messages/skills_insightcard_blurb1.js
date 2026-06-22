/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Insightcard_Blurb1Inputs */

const en_skills_insightcard_blurb1 = /** @type {((inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString) & { parts: (inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your top skills, learning snapshots, suggested lessons & careers, and TEDed content.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Your" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " top skills, learning snapshots, suggested lessons & careers, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "and" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " TEDed content." }])
			})
		}
	)
);

const es_skills_insightcard_blurb1 = /** @type {((inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString) & { parts: (inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tus mejores habilidades, resúmenes de aprendizaje, lecciones y carreras sugeridas, y contenido tipo TED.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Tus" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " mejores habilidades, resúmenes de aprendizaje, lecciones y carreras sugeridas, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "y" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " contenido tipo TED." }])
			})
		}
	)
);

const fr_skills_insightcard_blurb1 = /** @type {((inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString) & { parts: (inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Vos meilleures compétences, aperçus d'apprentissage, leçons et carrières suggérées, et du contenu façon TED.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Vos" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " meilleures compétences, aperçus d'apprentissage, leçons et carrières suggérées, " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "et" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " du contenu façon TED." }])
			})
		}
	)
);

const ar_skills_insightcard_blurb1 = /** @type {((inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString) & { parts: (inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`أفضل مهاراتك ولمحات تعلّمك والدروس والمسارات المهنية المقترحة و محتوى بأسلوب TED.`)
		}),
		{
			parts: /** @type {(inputs: Skills_Insightcard_Blurb1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "أفضل" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " مهاراتك ولمحات تعلّمك والدروس والمسارات المهنية المقترحة " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "و" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " محتوى بأسلوب TED." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your top skills, learning snapshots, suggested lessons & careers, and TEDed content." |
*
* @param {Skills_Insightcard_Blurb1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_insightcard_blurb1 = /** @type {((inputs?: Skills_Insightcard_Blurb1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Skills_Insightcard_Blurb1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skills_Insightcard_Blurb1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Skills_Insightcard_Blurb1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skills_insightcard_blurb1(inputs)
			if (locale === "es") return es_skills_insightcard_blurb1(inputs)
			if (locale === "fr") return fr_skills_insightcard_blurb1(inputs)
			return ar_skills_insightcard_blurb1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Skills_Insightcard_Blurb1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skills_insightcard_blurb1.parts === "function" ? en_skills_insightcard_blurb1.parts(inputs) : [{ type: "text", value: en_skills_insightcard_blurb1(inputs) }]
				if (locale === "es") return typeof es_skills_insightcard_blurb1.parts === "function" ? es_skills_insightcard_blurb1.parts(inputs) : [{ type: "text", value: es_skills_insightcard_blurb1(inputs) }]
				if (locale === "fr") return typeof fr_skills_insightcard_blurb1.parts === "function" ? fr_skills_insightcard_blurb1.parts(inputs) : [{ type: "text", value: fr_skills_insightcard_blurb1(inputs) }]
				return typeof ar_skills_insightcard_blurb1.parts === "function" ? ar_skills_insightcard_blurb1.parts(inputs) : [{ type: "text", value: ar_skills_insightcard_blurb1(inputs) }]
			})
		}
	)
);
export { skills_insightcard_blurb1 as "skills.insightCard.blurb" }