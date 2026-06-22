/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Getpermissionfromadult4Inputs */

const en_aiinsights_getpermissionfromadult4 = /** @type {((inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Get permission  from an adult.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Get permission " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " from an adult." }])
			})
		}
	)
);

const es_aiinsights_getpermissionfromadult4 = /** @type {((inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Obtén permiso  de un adulto.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Obtén permiso " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " de un adulto." }])
			})
		}
	)
);

const fr_aiinsights_getpermissionfromadult4 = /** @type {((inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Obtenez l'autorisation  d'un adulte.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Obtenez l'autorisation " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " d'un adulte." }])
			})
		}
	)
);

const ar_aiinsights_getpermissionfromadult4 = /** @type {((inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`احصل على إذن  من شخص بالغ.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Getpermissionfromadult4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "احصل على إذن " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " من شخص بالغ." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Get permission from an adult." |
*
* @param {Aiinsights_Getpermissionfromadult4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_getpermissionfromadult4 = /** @type {((inputs?: Aiinsights_Getpermissionfromadult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aiinsights_Getpermissionfromadult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Getpermissionfromadult4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { br: { options: {}; attributes: {}; children: false } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aiinsights_Getpermissionfromadult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_getpermissionfromadult4(inputs)
			if (locale === "es") return es_aiinsights_getpermissionfromadult4(inputs)
			if (locale === "fr") return fr_aiinsights_getpermissionfromadult4(inputs)
			return ar_aiinsights_getpermissionfromadult4(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aiinsights_Getpermissionfromadult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_getpermissionfromadult4.parts === "function" ? en_aiinsights_getpermissionfromadult4.parts(inputs) : [{ type: "text", value: en_aiinsights_getpermissionfromadult4(inputs) }]
				if (locale === "es") return typeof es_aiinsights_getpermissionfromadult4.parts === "function" ? es_aiinsights_getpermissionfromadult4.parts(inputs) : [{ type: "text", value: es_aiinsights_getpermissionfromadult4(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_getpermissionfromadult4.parts === "function" ? fr_aiinsights_getpermissionfromadult4.parts(inputs) : [{ type: "text", value: fr_aiinsights_getpermissionfromadult4(inputs) }]
				return typeof ar_aiinsights_getpermissionfromadult4.parts === "function" ? ar_aiinsights_getpermissionfromadult4.parts(inputs) : [{ type: "text", value: ar_aiinsights_getpermissionfromadult4(inputs) }]
			})
		}
	)
);
export { aiinsights_getpermissionfromadult4 as "aiInsights.getPermissionFromAdult" }