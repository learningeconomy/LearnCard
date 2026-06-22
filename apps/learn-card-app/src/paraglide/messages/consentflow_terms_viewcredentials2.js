/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Terms_Viewcredentials2Inputs */

const en_consentflow_terms_viewcredentials2 = /** @type {((inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString) & { parts: (inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`view and access credentials you select to share`)
		}),
		{
			parts: /** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "view and access credentials" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " you select to share" }])
			})
		}
	)
);

const es_consentflow_terms_viewcredentials2 = /** @type {((inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString) & { parts: (inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`ver y acceder a las credenciales que elijas compartir`)
		}),
		{
			parts: /** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "ver y acceder a las credenciales" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " que elijas compartir" }])
			})
		}
	)
);

const fr_consentflow_terms_viewcredentials2 = /** @type {((inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString) & { parts: (inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`voir et accéder aux justificatifs que vous choisissez de partager`)
		}),
		{
			parts: /** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "voir et accéder aux justificatifs" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " que vous choisissez de partager" }])
			})
		}
	)
);

const ar_consentflow_terms_viewcredentials2 = /** @type {((inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString) & { parts: (inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`عرض بيانات الاعتماد والوصول إليها التي تختار مشاركتها`)
		}),
		{
			parts: /** @type {(inputs: Consentflow_Terms_Viewcredentials2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "عرض بيانات الاعتماد والوصول إليها" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " التي تختار مشاركتها" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "view and access credentials you select to share" |
*
* @param {Consentflow_Terms_Viewcredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_terms_viewcredentials2 = /** @type {((inputs?: Consentflow_Terms_Viewcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Consentflow_Terms_Viewcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Consentflow_Terms_Viewcredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Consentflow_Terms_Viewcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_consentflow_terms_viewcredentials2(inputs)
			if (locale === "es") return es_consentflow_terms_viewcredentials2(inputs)
			if (locale === "fr") return fr_consentflow_terms_viewcredentials2(inputs)
			return ar_consentflow_terms_viewcredentials2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Consentflow_Terms_Viewcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_consentflow_terms_viewcredentials2.parts === "function" ? en_consentflow_terms_viewcredentials2.parts(inputs) : [{ type: "text", value: en_consentflow_terms_viewcredentials2(inputs) }]
				if (locale === "es") return typeof es_consentflow_terms_viewcredentials2.parts === "function" ? es_consentflow_terms_viewcredentials2.parts(inputs) : [{ type: "text", value: es_consentflow_terms_viewcredentials2(inputs) }]
				if (locale === "fr") return typeof fr_consentflow_terms_viewcredentials2.parts === "function" ? fr_consentflow_terms_viewcredentials2.parts(inputs) : [{ type: "text", value: fr_consentflow_terms_viewcredentials2(inputs) }]
				return typeof ar_consentflow_terms_viewcredentials2.parts === "function" ? ar_consentflow_terms_viewcredentials2.parts(inputs) : [{ type: "text", value: ar_consentflow_terms_viewcredentials2(inputs) }]
			})
		}
	)
);
export { consentflow_terms_viewcredentials2 as "consentFlow.terms.viewCredentials" }