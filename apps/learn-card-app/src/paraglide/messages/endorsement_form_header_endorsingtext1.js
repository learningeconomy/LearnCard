/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, title: NonNullable<unknown> }} Endorsement_Form_Header_Endorsingtext1Inputs */

const en_endorsement_form_header_endorsingtext1 = /** @type {((inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`You’re endorsing ${i?.name} for ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "You’re endorsing " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " for " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const es_endorsement_form_header_endorsingtext1 = /** @type {((inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Estás avalando a ${i?.name} por ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Estás avalando a " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " por " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_endorsement_form_header_endorsingtext1 = /** @type {((inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Vous recommandez ${i?.name} pour ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Vous recommandez " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " pour " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_endorsement_form_header_endorsingtext1 = /** @type {((inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`أنت توصي بـ ${i?.name} من أجل ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أنت توصي بـ " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " من أجل " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "You’re endorsing {name} for {title}" |
*
* @param {Endorsement_Form_Header_Endorsingtext1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_header_endorsingtext1 = /** @type {((inputs: Endorsement_Form_Header_Endorsingtext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Endorsement_Form_Header_Endorsingtext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Endorsement_Form_Header_Endorsingtext1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_endorsement_form_header_endorsingtext1(inputs)
			if (locale === "es") return es_endorsement_form_header_endorsingtext1(inputs)
			if (locale === "fr") return fr_endorsement_form_header_endorsingtext1(inputs)
			return ar_endorsement_form_header_endorsingtext1(inputs)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Header_Endorsingtext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_endorsement_form_header_endorsingtext1.parts === "function" ? en_endorsement_form_header_endorsingtext1.parts(inputs) : [{ type: "text", value: en_endorsement_form_header_endorsingtext1(inputs) }]
				if (locale === "es") return typeof es_endorsement_form_header_endorsingtext1.parts === "function" ? es_endorsement_form_header_endorsingtext1.parts(inputs) : [{ type: "text", value: es_endorsement_form_header_endorsingtext1(inputs) }]
				if (locale === "fr") return typeof fr_endorsement_form_header_endorsingtext1.parts === "function" ? fr_endorsement_form_header_endorsingtext1.parts(inputs) : [{ type: "text", value: fr_endorsement_form_header_endorsingtext1(inputs) }]
				return typeof ar_endorsement_form_header_endorsingtext1.parts === "function" ? ar_endorsement_form_header_endorsingtext1.parts(inputs) : [{ type: "text", value: ar_endorsement_form_header_endorsingtext1(inputs) }]
			})
		}
	)
);
export { endorsement_form_header_endorsingtext1 as "endorsement.form.header.endorsingText" }