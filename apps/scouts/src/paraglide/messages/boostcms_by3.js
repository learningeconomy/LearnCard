/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Boostcms_By3Inputs */

const en_boostcms_by3 = /** @type {((inputs: Boostcms_By3Inputs) => LocalizedString) & { parts: (inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_By3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`by ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "by " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_boostcms_by3 = /** @type {((inputs: Boostcms_By3Inputs) => LocalizedString) & { parts: (inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_By3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`por ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "por " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_boostcms_by3 = /** @type {((inputs: Boostcms_By3Inputs) => LocalizedString) & { parts: (inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_By3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`par ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "par " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_boostcms_by3 = /** @type {((inputs: Boostcms_By3Inputs) => LocalizedString) & { parts: (inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_By3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`by ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Boostcms_By3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "by " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "by {name}" |
*
* @param {Boostcms_By3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_by3 = /** @type {((inputs: Boostcms_By3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Boostcms_By3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Boostcms_By3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boostcms_By3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_boostcms_by3(inputs)
			if (locale === "es") return es_boostcms_by3(inputs)
			if (locale === "fr") return fr_boostcms_by3(inputs)
			return ar_boostcms_by3(inputs)
		}),
		{
			parts: /** @type {(inputs: Boostcms_By3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_boostcms_by3.parts === "function" ? en_boostcms_by3.parts(inputs) : [{ type: "text", value: en_boostcms_by3(inputs) }]
				if (locale === "es") return typeof es_boostcms_by3.parts === "function" ? es_boostcms_by3.parts(inputs) : [{ type: "text", value: es_boostcms_by3(inputs) }]
				if (locale === "fr") return typeof fr_boostcms_by3.parts === "function" ? fr_boostcms_by3.parts(inputs) : [{ type: "text", value: fr_boostcms_by3(inputs) }]
				return typeof ar_boostcms_by3.parts === "function" ? ar_boostcms_by3.parts(inputs) : [{ type: "text", value: ar_boostcms_by3(inputs) }]
			})
		}
	)
);
export { boostcms_by3 as "boostCMS.by" }