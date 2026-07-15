/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Addressbook_Wouldyouliketoconnect5Inputs */

const en_addressbook_wouldyouliketoconnect5 = /** @type {((inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Would you like toconnect with ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Would you like to" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "connect with " }, { type: "text", value: String(i?.name) }, { type: "text", value: "?" }])
			})
		}
	)
);

const es_addressbook_wouldyouliketoconnect5 = /** @type {((inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`¿Te gustaríaconectar con ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "¿Te gustaría" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "conectar con " }, { type: "text", value: String(i?.name) }, { type: "text", value: "?" }])
			})
		}
	)
);

const fr_addressbook_wouldyouliketoconnect5 = /** @type {((inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Souhaitez-vousvous connecter avec ${i?.name} ?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Souhaitez-vous" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "vous connecter avec " }, { type: "text", value: String(i?.name) }, { type: "text", value: " ?" }])
			})
		}
	)
);

const ar_addressbook_wouldyouliketoconnect5 = /** @type {((inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Would you like toconnect with ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Would you like to" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "connect with " }, { type: "text", value: String(i?.name) }, { type: "text", value: "?" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Would you like toconnect with {name}?" |
*
* @param {Addressbook_Wouldyouliketoconnect5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_wouldyouliketoconnect5 = /** @type {((inputs: Addressbook_Wouldyouliketoconnect5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Addressbook_Wouldyouliketoconnect5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Addressbook_Wouldyouliketoconnect5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "1": { options: {}; attributes: {}; children: false } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_addressbook_wouldyouliketoconnect5(inputs)
			if (locale === "es") return es_addressbook_wouldyouliketoconnect5(inputs)
			if (locale === "fr") return fr_addressbook_wouldyouliketoconnect5(inputs)
			return ar_addressbook_wouldyouliketoconnect5(inputs)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Wouldyouliketoconnect5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_addressbook_wouldyouliketoconnect5.parts === "function" ? en_addressbook_wouldyouliketoconnect5.parts(inputs) : [{ type: "text", value: en_addressbook_wouldyouliketoconnect5(inputs) }]
				if (locale === "es") return typeof es_addressbook_wouldyouliketoconnect5.parts === "function" ? es_addressbook_wouldyouliketoconnect5.parts(inputs) : [{ type: "text", value: es_addressbook_wouldyouliketoconnect5(inputs) }]
				if (locale === "fr") return typeof fr_addressbook_wouldyouliketoconnect5.parts === "function" ? fr_addressbook_wouldyouliketoconnect5.parts(inputs) : [{ type: "text", value: fr_addressbook_wouldyouliketoconnect5(inputs) }]
				return typeof ar_addressbook_wouldyouliketoconnect5.parts === "function" ? ar_addressbook_wouldyouliketoconnect5.parts(inputs) : [{ type: "text", value: ar_addressbook_wouldyouliketoconnect5(inputs) }]
			})
		}
	)
);
export { addressbook_wouldyouliketoconnect5 as "addressBook.wouldYouLikeToConnect" }