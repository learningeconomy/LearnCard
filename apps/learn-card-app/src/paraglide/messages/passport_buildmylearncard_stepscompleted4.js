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

const de_passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.completed} von ${i?.total} Schritten abgeschlossen`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.completed) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " von " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.total) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " Schritten abgeschlossen" }])
			})
		}
	)
);

const ar_passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`اكتملت ${i?.completed} من أصل ${i?.total} خطوات`)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "اكتملت " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.completed) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " من أصل " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.total) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " خطوات" }])
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
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_stepscompleted4 = /** @type {((inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & { parts: (inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Stepscompleted4Inputs, { locale?: "en" | "es" | "de" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_passport_buildmylearncard_stepscompleted4(inputs)
			if (locale === "es") return es_passport_buildmylearncard_stepscompleted4(inputs)
			if (locale === "de") return de_passport_buildmylearncard_stepscompleted4(inputs)
			return ar_passport_buildmylearncard_stepscompleted4(inputs)
		}),
		{
			parts: /** @type {(inputs: Passport_Buildmylearncard_Stepscompleted4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_passport_buildmylearncard_stepscompleted4.parts === "function" ? en_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: en_passport_buildmylearncard_stepscompleted4(inputs) }]
				if (locale === "es") return typeof es_passport_buildmylearncard_stepscompleted4.parts === "function" ? es_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: es_passport_buildmylearncard_stepscompleted4(inputs) }]
				if (locale === "de") return typeof de_passport_buildmylearncard_stepscompleted4.parts === "function" ? de_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: de_passport_buildmylearncard_stepscompleted4(inputs) }]
				return typeof ar_passport_buildmylearncard_stepscompleted4.parts === "function" ? ar_passport_buildmylearncard_stepscompleted4.parts(inputs) : [{ type: "text", value: ar_passport_buildmylearncard_stepscompleted4(inputs) }]
			})
		}
	)
);
export { passport_buildmylearncard_stepscompleted4 as "passport.buildMyLearnCard.stepsCompleted" }