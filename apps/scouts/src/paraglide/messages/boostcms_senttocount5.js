/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown>, count: NonNullable<unknown>, person: NonNullable<unknown> }} Boostcms_Senttocount5Inputs */

const en_boostcms_senttocount5 = /** @type {((inputs: Boostcms_Senttocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Senttocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.type} issued to ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.type) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " issued to " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const es_boostcms_senttocount5 = /** @type {((inputs: Boostcms_Senttocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Senttocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.type} emitido a ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.type) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " emitido a " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_boostcms_senttocount5 = /** @type {((inputs: Boostcms_Senttocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Senttocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.type} délivré à ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.type) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " délivré à " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_boostcms_senttocount5 = /** @type {((inputs: Boostcms_Senttocount5Inputs) => LocalizedString) & { parts: (inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Senttocount5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.type} صدر لـ ${i?.count} ${i?.person}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Senttocount5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.type) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " صدر لـ " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " " }, { type: "text", value: String(i?.person) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "{type} issued to {count} {person}" |
*
* @param {Boostcms_Senttocount5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_senttocount5 = /** @type {((inputs: Boostcms_Senttocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Boostcms_Senttocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Boostcms_Senttocount5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_Senttocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_boostcms_senttocount5(inputs)
			if (locale === "es") return es_boostcms_senttocount5(inputs)
			if (locale === "fr") return fr_boostcms_senttocount5(inputs)
			return ar_boostcms_senttocount5(inputs)
		}),
		{
			parts: /** @type {(inputs: Boostcms_Senttocount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_boostcms_senttocount5.parts === "function" ? en_boostcms_senttocount5.parts(inputs) : [{ type: "text", value: en_boostcms_senttocount5(inputs) }]
				if (locale === "es") return typeof es_boostcms_senttocount5.parts === "function" ? es_boostcms_senttocount5.parts(inputs) : [{ type: "text", value: es_boostcms_senttocount5(inputs) }]
				if (locale === "fr") return typeof fr_boostcms_senttocount5.parts === "function" ? fr_boostcms_senttocount5.parts(inputs) : [{ type: "text", value: fr_boostcms_senttocount5(inputs) }]
				return typeof ar_boostcms_senttocount5.parts === "function" ? ar_boostcms_senttocount5.parts(inputs) : [{ type: "text", value: ar_boostcms_senttocount5(inputs) }]
			})
		}
	)
);
export { boostcms_senttocount5 as "boostCMS.sentToCount" }