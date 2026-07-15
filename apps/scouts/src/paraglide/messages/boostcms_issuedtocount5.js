/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, person: NonNullable<unknown> }} Boostcms_Issuedtocount5Inputs */

const en_boostcms_issuedtocount5 = /** @type {((inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Issued to ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Issued to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_boostcms_issuedtocount5 = /** @type {((inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Emitido a ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Emitido a " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_boostcms_issuedtocount5 = /** @type {((inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Délivré à ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Délivré à " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_boostcms_issuedtocount5 = /** @type {((inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Issuedtocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Issued to ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Issuedtocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Issued to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Issued to {count} {person}" |
*
* @param {Boostcms_Issuedtocount5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_issuedtocount5 = /** @type {((inputs: Boostcms_Issuedtocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Boostcms_Issuedtocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Boostcms_Issuedtocount5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Issuedtocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_boostcms_issuedtocount5(inputs)
			if (locale === "es") return es_boostcms_issuedtocount5(inputs)
			if (locale === "fr") return fr_boostcms_issuedtocount5(inputs)
			return ar_boostcms_issuedtocount5(inputs)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Issuedtocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_boostcms_issuedtocount5.parts === "function" ? en_boostcms_issuedtocount5.parts(inputs) : [{ type: "text", value: en_boostcms_issuedtocount5(inputs) }]
				if (locale === "es") return typeof es_boostcms_issuedtocount5.parts === "function" ? es_boostcms_issuedtocount5.parts(inputs) : [{ type: "text", value: es_boostcms_issuedtocount5(inputs) }]
				if (locale === "fr") return typeof fr_boostcms_issuedtocount5.parts === "function" ? fr_boostcms_issuedtocount5.parts(inputs) : [{ type: "text", value: fr_boostcms_issuedtocount5(inputs) }]
				return typeof ar_boostcms_issuedtocount5.parts === "function" ? ar_boostcms_issuedtocount5.parts(inputs) : [{ type: "text", value: ar_boostcms_issuedtocount5(inputs) }]
			})
		}
	)
);
export { boostcms_issuedtocount5 as "boostCMS.issuedToCount" }