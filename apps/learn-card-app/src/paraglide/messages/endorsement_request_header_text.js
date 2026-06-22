/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ categoryType: NonNullable<unknown>, title: NonNullable<unknown> }} Endorsement_Request_Header_TextInputs */

const en_endorsement_request_header_text = /** @type {((inputs: Endorsement_Request_Header_TextInputs) => LocalizedString) & { parts: (inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Request_Header_TextInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Send a request to someone who can vouch for your ${i?.categoryType}, ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Send a request to someone who can vouch for your " }, { type: "text", value: String(i?.categoryType) }, { type: "text", value: ", " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const es_endorsement_request_header_text = /** @type {((inputs: Endorsement_Request_Header_TextInputs) => LocalizedString) & { parts: (inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Request_Header_TextInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Envía una solicitud a alguien que pueda dar fe de tu ${i?.categoryType}, ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Envía una solicitud a alguien que pueda dar fe de tu " }, { type: "text", value: String(i?.categoryType) }, { type: "text", value: ", " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_endorsement_request_header_text = /** @type {((inputs: Endorsement_Request_Header_TextInputs) => LocalizedString) & { parts: (inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Request_Header_TextInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Envoyez une demande à quelqu'un qui peut se porter garant de votre ${i?.categoryType}, ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Envoyez une demande à quelqu'un qui peut se porter garant de votre " }, { type: "text", value: String(i?.categoryType) }, { type: "text", value: ", " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_endorsement_request_header_text = /** @type {((inputs: Endorsement_Request_Header_TextInputs) => LocalizedString) & { parts: (inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Request_Header_TextInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`أرسل طلبًا إلى شخص يمكنه الإشهاد بـ ${i?.categoryType} الخاص بك، ${i?.title}.`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Request_Header_TextInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أرسل طلبًا إلى شخص يمكنه الإشهاد بـ " }, { type: "text", value: String(i?.categoryType) }, { type: "text", value: " الخاص بك، " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Send a request to someone who can vouch for your {categoryType}, {title}." |
*
* @param {Endorsement_Request_Header_TextInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_header_text = /** @type {((inputs: Endorsement_Request_Header_TextInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Endorsement_Request_Header_TextInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Endorsement_Request_Header_TextInputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Request_Header_TextInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_endorsement_request_header_text(inputs)
			if (locale === "es") return es_endorsement_request_header_text(inputs)
			if (locale === "fr") return fr_endorsement_request_header_text(inputs)
			return ar_endorsement_request_header_text(inputs)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Request_Header_TextInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_endorsement_request_header_text.parts === "function" ? en_endorsement_request_header_text.parts(inputs) : [{ type: "text", value: en_endorsement_request_header_text(inputs) }]
				if (locale === "es") return typeof es_endorsement_request_header_text.parts === "function" ? es_endorsement_request_header_text.parts(inputs) : [{ type: "text", value: es_endorsement_request_header_text(inputs) }]
				if (locale === "fr") return typeof fr_endorsement_request_header_text.parts === "function" ? fr_endorsement_request_header_text.parts(inputs) : [{ type: "text", value: fr_endorsement_request_header_text(inputs) }]
				return typeof ar_endorsement_request_header_text.parts === "function" ? ar_endorsement_request_header_text.parts(inputs) : [{ type: "text", value: ar_endorsement_request_header_text(inputs) }]
			})
		}
	)
);
export { endorsement_request_header_text as "endorsement.request.header.text" }