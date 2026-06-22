/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ completed: NonNullable<unknown>, total: NonNullable<unknown> }} Passport_Buildmylearncard_Stepscompleted4Inputs */

const en_passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.completed} of ${i?.total} Steps Completed`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.completed) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " of " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.total) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " Steps Completed" }])
			})
		}
	)
);

const es_passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.completed} de ${i?.total} pasos completados`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.completed) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " de " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.total) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " pasos completados" }])
			})
		}
	)
);

const fr_passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.completed} sur ${i?.total} étapes terminées`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.completed) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " sur " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.total) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " étapes terminées" }])
			})
		}
	)
);

const ar_passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.completed} من ${i?.total} خطوات مكتملة`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.completed) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " من " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.total) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " خطوات مكتملة" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "{completed} of {total} Steps Completed" |
*
* @param {Passport_Buildmylearncard_Stepscompleted4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Stepscompleted4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_passport_buildmylearncard_stepscompleted4(inputs)
			if (locale === "es") return es_passport_buildmylearncard_stepscompleted4(inputs)
			if (locale === "fr") return fr_passport_buildmylearncard_stepscompleted4(inputs)
			return ar_passport_buildmylearncard_stepscompleted4(inputs)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_passport_buildmylearncard_stepscompleted4.parts === "function" ? en_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: en_passport_buildmylearncard_stepscompleted4(inputs) }]
				if (locale === "es") return typeof es_passport_buildmylearncard_stepscompleted4.parts === "function" ? es_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: es_passport_buildmylearncard_stepscompleted4(inputs) }]
				if (locale === "fr") return typeof fr_passport_buildmylearncard_stepscompleted4.parts === "function" ? fr_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: fr_passport_buildmylearncard_stepscompleted4(inputs) }]
				return typeof ar_passport_buildmylearncard_stepscompleted4.parts === "function" ? ar_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: ar_passport_buildmylearncard_stepscompleted4(inputs) }]
			})
		}
	)
);
export { passport_buildmylearncard_stepscompleted4 as "passport.buildMyLearnCard.stepsCompleted" }