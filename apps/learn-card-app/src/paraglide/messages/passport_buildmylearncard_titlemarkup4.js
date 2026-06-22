/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Buildmylearncard_Titlemarkup4Inputs */

const en_passport_buildmylearncard_titlemarkup4 = /** @type {((inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Build My ${i?.brand}`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Build My " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.brand) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_passport_buildmylearncard_titlemarkup4 = /** @type {((inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Construye tu ${i?.brand}`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Construye tu " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.brand) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_passport_buildmylearncard_titlemarkup4 = /** @type {((inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Construire mon ${i?.brand}`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Construire mon " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.brand) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_passport_buildmylearncard_titlemarkup4 = /** @type {((inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`إنشاء ${i?.brand} الخاص بي`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "إنشاء " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.brand) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " الخاص بي" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Build My {brand}" |
*
* @param {Passport_Buildmylearncard_Titlemarkup4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_titlemarkup4 = /** @type {((inputs: Passport_Buildmylearncard_Titlemarkup4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Titlemarkup4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Titlemarkup4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_passport_buildmylearncard_titlemarkup4(inputs)
			if (locale === "es") return es_passport_buildmylearncard_titlemarkup4(inputs)
			if (locale === "fr") return fr_passport_buildmylearncard_titlemarkup4(inputs)
			return ar_passport_buildmylearncard_titlemarkup4(inputs)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Titlemarkup4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_passport_buildmylearncard_titlemarkup4.parts === "function" ? en_passport_buildmylearncard_titlemarkup4.parts(inputs) : [{ type: "text", value: en_passport_buildmylearncard_titlemarkup4(inputs) }]
				if (locale === "es") return typeof es_passport_buildmylearncard_titlemarkup4.parts === "function" ? es_passport_buildmylearncard_titlemarkup4.parts(inputs) : [{ type: "text", value: es_passport_buildmylearncard_titlemarkup4(inputs) }]
				if (locale === "fr") return typeof fr_passport_buildmylearncard_titlemarkup4.parts === "function" ? fr_passport_buildmylearncard_titlemarkup4.parts(inputs) : [{ type: "text", value: fr_passport_buildmylearncard_titlemarkup4(inputs) }]
				return typeof ar_passport_buildmylearncard_titlemarkup4.parts === "function" ? ar_passport_buildmylearncard_titlemarkup4.parts(inputs) : [{ type: "text", value: ar_passport_buildmylearncard_titlemarkup4(inputs) }]
			})
		}
	)
);
export { passport_buildmylearncard_titlemarkup4 as "passport.buildMyLearnCard.titleMarkup" }