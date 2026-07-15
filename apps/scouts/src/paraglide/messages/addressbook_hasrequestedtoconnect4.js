/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Addressbook_Hasrequestedtoconnect4Inputs */

const en_addressbook_hasrequestedtoconnect4 = /** @type {((inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} has requestedto connect with you?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: String(i?.name) }, { type: "text", value: " has requested" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "to connect with you?" }])
			})
		}
	)
);

const es_addressbook_hasrequestedtoconnect4 = /** @type {((inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} ha solicitadoconectar contigo`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: String(i?.name) }, { type: "text", value: " ha solicitado" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "conectar contigo" }])
			})
		}
	)
);

const fr_addressbook_hasrequestedtoconnect4 = /** @type {((inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} a demandéà se connecter avec vous ?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: String(i?.name) }, { type: "text", value: " a demandé" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "à se connecter avec vous ?" }])
			})
		}
	)
);

const ar_addressbook_hasrequestedtoconnect4 = /** @type {((inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString) & { parts: (inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} has requestedto connect with you?`)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: String(i?.name) }, { type: "text", value: " has requested" }, { type: "markup-standalone", name: "1", options: {}, attributes: {} }, { type: "text", value: "to connect with you?" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "{name} has requestedto connect with you?" |
*
* @param {Addressbook_Hasrequestedtoconnect4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_hasrequestedtoconnect4 = /** @type {((inputs: Addressbook_Hasrequestedtoconnect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Addressbook_Hasrequestedtoconnect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Addressbook_Hasrequestedtoconnect4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "1": { options: {}; attributes: {}; children: false } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_addressbook_hasrequestedtoconnect4(inputs)
			if (locale === "es") return es_addressbook_hasrequestedtoconnect4(inputs)
			if (locale === "fr") return fr_addressbook_hasrequestedtoconnect4(inputs)
			return ar_addressbook_hasrequestedtoconnect4(inputs)
		}),
		{
			parts: /** @type {(inputs: Addressbook_Hasrequestedtoconnect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_addressbook_hasrequestedtoconnect4.parts === "function" ? en_addressbook_hasrequestedtoconnect4.parts(inputs) : [{ type: "text", value: en_addressbook_hasrequestedtoconnect4(inputs) }]
				if (locale === "es") return typeof es_addressbook_hasrequestedtoconnect4.parts === "function" ? es_addressbook_hasrequestedtoconnect4.parts(inputs) : [{ type: "text", value: es_addressbook_hasrequestedtoconnect4(inputs) }]
				if (locale === "fr") return typeof fr_addressbook_hasrequestedtoconnect4.parts === "function" ? fr_addressbook_hasrequestedtoconnect4.parts(inputs) : [{ type: "text", value: fr_addressbook_hasrequestedtoconnect4(inputs) }]
				return typeof ar_addressbook_hasrequestedtoconnect4.parts === "function" ? ar_addressbook_hasrequestedtoconnect4.parts(inputs) : [{ type: "text", value: ar_addressbook_hasrequestedtoconnect4(inputs) }]
			})
		}
	)
);
export { addressbook_hasrequestedtoconnect4 as "addressBook.hasRequestedToConnect" }