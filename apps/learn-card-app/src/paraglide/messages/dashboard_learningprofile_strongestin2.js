/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Dashboard_Learningprofile_Strongestin2Inputs */

const en_dashboard_learningprofile_strongestin2 = /** @type {((inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString) & { parts: (inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`You're strongest in ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "You're strongest in " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const es_dashboard_learningprofile_strongestin2 = /** @type {((inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString) & { parts: (inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Tu mayor fortaleza está en ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Tu mayor fortaleza está en " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_dashboard_learningprofile_strongestin2 = /** @type {((inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString) & { parts: (inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Votre point fort, c'est ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Votre point fort, c'est " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_dashboard_learningprofile_strongestin2 = /** @type {((inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString) & { parts: (inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`أقوى ما لديك هو ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أقوى ما لديك هو " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "You're strongest in {title}." |
*
* @param {Dashboard_Learningprofile_Strongestin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_strongestin2 = /** @type {((inputs: Dashboard_Learningprofile_Strongestin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Dashboard_Learningprofile_Strongestin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Strongestin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_dashboard_learningprofile_strongestin2(inputs)
			if (locale === "es") return es_dashboard_learningprofile_strongestin2(inputs)
			if (locale === "fr") return fr_dashboard_learningprofile_strongestin2(inputs)
			return ar_dashboard_learningprofile_strongestin2(inputs)
		}),
		{
			parts: /** @type {(inputs: Dashboard_Learningprofile_Strongestin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_dashboard_learningprofile_strongestin2.parts === "function" ? en_dashboard_learningprofile_strongestin2.parts(inputs) : [{ type: "text", value: en_dashboard_learningprofile_strongestin2(inputs) }]
				if (locale === "es") return typeof es_dashboard_learningprofile_strongestin2.parts === "function" ? es_dashboard_learningprofile_strongestin2.parts(inputs) : [{ type: "text", value: es_dashboard_learningprofile_strongestin2(inputs) }]
				if (locale === "fr") return typeof fr_dashboard_learningprofile_strongestin2.parts === "function" ? fr_dashboard_learningprofile_strongestin2.parts(inputs) : [{ type: "text", value: fr_dashboard_learningprofile_strongestin2(inputs) }]
				return typeof ar_dashboard_learningprofile_strongestin2.parts === "function" ? ar_dashboard_learningprofile_strongestin2.parts(inputs) : [{ type: "text", value: ar_dashboard_learningprofile_strongestin2(inputs) }]
			})
		}
	)
);
export { dashboard_learningprofile_strongestin2 as "dashboard.learningProfile.strongestIn" }