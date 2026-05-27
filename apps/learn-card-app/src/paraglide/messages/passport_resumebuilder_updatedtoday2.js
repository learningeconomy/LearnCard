/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Updatedtoday2Inputs */

const en_passport_resumebuilder_updatedtoday2 = /** @type {((inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString) & { parts: (inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Updated today`)
		}),
		{
			parts: /** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Updated " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "today" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_passport_resumebuilder_updatedtoday2 = /** @type {((inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString) & { parts: (inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Actualizado hoy`)
		}),
		{
			parts: /** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Actualizado " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "hoy" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const de_passport_resumebuilder_updatedtoday2 = /** @type {((inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString) & { parts: (inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Aktualisiert heute`)
		}),
		{
			parts: /** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Aktualisiert " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "heute" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_passport_resumebuilder_updatedtoday2 = /** @type {((inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString) & { parts: (inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`تم التحديث اليوم`)
		}),
		{
			parts: /** @type {(inputs: Passport_Resumebuilder_Updatedtoday2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "تم التحديث " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "اليوم" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Updated today" |
*
* @param {Passport_Resumebuilder_Updatedtoday2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_updatedtoday2 = /** @type {((inputs?: Passport_Resumebuilder_Updatedtoday2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & { parts: (inputs?: Passport_Resumebuilder_Updatedtoday2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Updatedtoday2Inputs, { locale?: "en" | "es" | "de" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Passport_Resumebuilder_Updatedtoday2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_passport_resumebuilder_updatedtoday2(inputs)
			if (locale === "es") return es_passport_resumebuilder_updatedtoday2(inputs)
			if (locale === "de") return de_passport_resumebuilder_updatedtoday2(inputs)
			return ar_passport_resumebuilder_updatedtoday2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Passport_Resumebuilder_Updatedtoday2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_passport_resumebuilder_updatedtoday2.parts === "function" ? en_passport_resumebuilder_updatedtoday2.parts(inputs) : [{ type: "text", value: en_passport_resumebuilder_updatedtoday2(inputs) }]
				if (locale === "es") return typeof es_passport_resumebuilder_updatedtoday2.parts === "function" ? es_passport_resumebuilder_updatedtoday2.parts(inputs) : [{ type: "text", value: es_passport_resumebuilder_updatedtoday2(inputs) }]
				if (locale === "de") return typeof de_passport_resumebuilder_updatedtoday2.parts === "function" ? de_passport_resumebuilder_updatedtoday2.parts(inputs) : [{ type: "text", value: de_passport_resumebuilder_updatedtoday2(inputs) }]
				return typeof ar_passport_resumebuilder_updatedtoday2.parts === "function" ? ar_passport_resumebuilder_updatedtoday2.parts(inputs) : [{ type: "text", value: ar_passport_resumebuilder_updatedtoday2(inputs) }]
			})
		}
	)
);
export { passport_resumebuilder_updatedtoday2 as "passport.resumeBuilder.updatedToday" }