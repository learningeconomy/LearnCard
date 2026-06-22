/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Endorsement_Form_Text_PromptInputs */

const en_endorsement_form_text_prompt = /** @type {((inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Write a brief message to support or confirm ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Write a brief message to support or confirm " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_endorsement_form_text_prompt = /** @type {((inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Escribe un mensaje breve para respaldar o confirmar ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Escribe un mensaje breve para respaldar o confirmar " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_endorsement_form_text_prompt = /** @type {((inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Rédigez un bref message pour appuyer ou confirmer ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Rédigez un bref message pour appuyer ou confirmer " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_endorsement_form_text_prompt = /** @type {((inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString) & { parts: (inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Text_PromptInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`اكتب رسالة قصيرة لدعم أو تأكيد ${i?.title}`)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Text_PromptInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "اكتب رسالة قصيرة لدعم أو تأكيد " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.title) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Write a brief message to support or confirm {title}" |
*
* @param {Endorsement_Form_Text_PromptInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_text_prompt = /** @type {((inputs: Endorsement_Form_Text_PromptInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Endorsement_Form_Text_PromptInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Endorsement_Form_Text_PromptInputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Endorsement_Form_Text_PromptInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_endorsement_form_text_prompt(inputs)
			if (locale === "es") return es_endorsement_form_text_prompt(inputs)
			if (locale === "fr") return fr_endorsement_form_text_prompt(inputs)
			return ar_endorsement_form_text_prompt(inputs)
		}),
		{
			parts: /** @type {(inputs: Endorsement_Form_Text_PromptInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_endorsement_form_text_prompt.parts === "function" ? en_endorsement_form_text_prompt.parts(inputs) : [{ type: "text", value: en_endorsement_form_text_prompt(inputs) }]
				if (locale === "es") return typeof es_endorsement_form_text_prompt.parts === "function" ? es_endorsement_form_text_prompt.parts(inputs) : [{ type: "text", value: es_endorsement_form_text_prompt(inputs) }]
				if (locale === "fr") return typeof fr_endorsement_form_text_prompt.parts === "function" ? fr_endorsement_form_text_prompt.parts(inputs) : [{ type: "text", value: fr_endorsement_form_text_prompt(inputs) }]
				return typeof ar_endorsement_form_text_prompt.parts === "function" ? ar_endorsement_form_text_prompt.parts(inputs) : [{ type: "text", value: ar_endorsement_form_text_prompt(inputs) }]
			})
		}
	)
);
export { endorsement_form_text_prompt as "endorsement.form.text.prompt" }