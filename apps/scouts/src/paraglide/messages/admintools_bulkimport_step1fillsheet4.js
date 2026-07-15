/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Step1fillsheet4Inputs */

const en_admintools_bulkimport_step1fillsheet4 = /** @type {((inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString) & { parts: (inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`1. Fill out this Google Sheet using:`)
		}),
		{
			parts: /** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "1. Fill out this " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Google Sheet" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " using:" }])
			})
		}
	)
);

const es_admintools_bulkimport_step1fillsheet4 = /** @type {((inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString) & { parts: (inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`1. Completa esta Hoja de Google usando:`)
		}),
		{
			parts: /** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "1. Completa esta " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Hoja de Google" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " usando:" }])
			})
		}
	)
);

const fr_admintools_bulkimport_step1fillsheet4 = /** @type {((inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString) & { parts: (inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`1. Remplissez cette feuille Google en utilisant :`)
		}),
		{
			parts: /** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "1. Remplissez cette " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "feuille Google" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " en utilisant :" }])
			})
		}
	)
);

const ar_admintools_bulkimport_step1fillsheet4 = /** @type {((inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString) & { parts: (inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`1. املأ جداول بيانات Google هذه باستخدام:`)
		}),
		{
			parts: /** @type {(inputs: Admintools_Bulkimport_Step1fillsheet4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "1. املأ " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "جداول بيانات Google" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " هذه باستخدام:" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "1. Fill out this Google Sheet using:" |
*
* @param {Admintools_Bulkimport_Step1fillsheet4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_step1fillsheet4 = /** @type {((inputs?: Admintools_Bulkimport_Step1fillsheet4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Admintools_Bulkimport_Step1fillsheet4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Step1fillsheet4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Admintools_Bulkimport_Step1fillsheet4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_admintools_bulkimport_step1fillsheet4(inputs)
			if (locale === "es") return es_admintools_bulkimport_step1fillsheet4(inputs)
			if (locale === "fr") return fr_admintools_bulkimport_step1fillsheet4(inputs)
			return ar_admintools_bulkimport_step1fillsheet4(inputs)
		}),
		{
			parts: /** @type {(inputs?: Admintools_Bulkimport_Step1fillsheet4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_admintools_bulkimport_step1fillsheet4.parts === "function" ? en_admintools_bulkimport_step1fillsheet4.parts(inputs) : [{ type: "text", value: en_admintools_bulkimport_step1fillsheet4(inputs) }]
				if (locale === "es") return typeof es_admintools_bulkimport_step1fillsheet4.parts === "function" ? es_admintools_bulkimport_step1fillsheet4.parts(inputs) : [{ type: "text", value: es_admintools_bulkimport_step1fillsheet4(inputs) }]
				if (locale === "fr") return typeof fr_admintools_bulkimport_step1fillsheet4.parts === "function" ? fr_admintools_bulkimport_step1fillsheet4.parts(inputs) : [{ type: "text", value: fr_admintools_bulkimport_step1fillsheet4(inputs) }]
				return typeof ar_admintools_bulkimport_step1fillsheet4.parts === "function" ? ar_admintools_bulkimport_step1fillsheet4.parts(inputs) : [{ type: "text", value: ar_admintools_bulkimport_step1fillsheet4(inputs) }]
			})
		}
	)
);
export { admintools_bulkimport_step1fillsheet4 as "adminTools.bulkImport.step1FillSheet" }