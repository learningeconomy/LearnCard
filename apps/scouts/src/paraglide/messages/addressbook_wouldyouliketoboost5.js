/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Addressbook_Wouldyouliketoboost5Inputs */

const en_addressbook_wouldyouliketoboost5 = /** @type {((inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Would you like to boost ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Would you like to " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "boost " }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "?" }])
			})
		}
	)
);

const es_addressbook_wouldyouliketoboost5 = /** @type {((inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`¿Te gustaría boostear a ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "¿Te gustaría " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "boostear a " }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "?" }])
			})
		}
	)
);

const fr_addressbook_wouldyouliketoboost5 = /** @type {((inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Souhaitez-vous booster ${i?.name} ?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Souhaitez-vous " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "booster " }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " ?" }])
			})
		}
	)
);

const ar_addressbook_wouldyouliketoboost5 = /** @type {((inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`هل ترغب في تعزيز ${i?.name}؟`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "هل ترغب في " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "تعزيز " }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "؟" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Would you like to boost {name}?" |
*
* @param {Addressbook_Wouldyouliketoboost5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_wouldyouliketoboost5 = /** @type {((inputs: Addressbook_Wouldyouliketoboost5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoboost5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Addressbook_Wouldyouliketoboost5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_addressbook_wouldyouliketoboost5(inputs)
			if (locale === "es") return es_addressbook_wouldyouliketoboost5(inputs)
			if (locale === "fr") return fr_addressbook_wouldyouliketoboost5(inputs)
			return ar_addressbook_wouldyouliketoboost5(inputs)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoboost5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_addressbook_wouldyouliketoboost5.parts === "function" ? en_addressbook_wouldyouliketoboost5.parts(inputs) : [{ type: "text", value: en_addressbook_wouldyouliketoboost5(inputs) }]
				if (locale === "es") return typeof es_addressbook_wouldyouliketoboost5.parts === "function" ? es_addressbook_wouldyouliketoboost5.parts(inputs) : [{ type: "text", value: es_addressbook_wouldyouliketoboost5(inputs) }]
				if (locale === "fr") return typeof fr_addressbook_wouldyouliketoboost5.parts === "function" ? fr_addressbook_wouldyouliketoboost5.parts(inputs) : [{ type: "text", value: fr_addressbook_wouldyouliketoboost5(inputs) }]
				return typeof ar_addressbook_wouldyouliketoboost5.parts === "function" ? ar_addressbook_wouldyouliketoboost5.parts(inputs) : [{ type: "text", value: ar_addressbook_wouldyouliketoboost5(inputs) }]
			})
		}
	)
);
export { addressbook_wouldyouliketoboost5 as "addressBook.wouldYouLikeToBoost" }