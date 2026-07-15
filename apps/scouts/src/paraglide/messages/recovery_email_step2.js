/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Step2Inputs */

const en_recovery_email_step2 = /** @type {((inputs: Recovery_Email_Step2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Find the long string of characters between "RECOVERY KEY" and "END RECOVERY KEY"`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Find the long string of characters between " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "\"RECOVERY KEY\"" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " and " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "\"END RECOVERY KEY\"" }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const es_recovery_email_step2 = /** @type {((inputs: Recovery_Email_Step2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Encuentra la larga cadena de caracteres entre "RECOVERY KEY" y "END RECOVERY KEY"`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Encuentra la larga cadena de caracteres entre " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "\"RECOVERY KEY\"" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " y " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "\"END RECOVERY KEY\"" }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_recovery_email_step2 = /** @type {((inputs: Recovery_Email_Step2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Trouvez la longue chaîne de caractères entre « CLÉ DE RÉCUPÉRATION » et « FIN DE LA CLÉ DE RÉCUPÉRATION »`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Trouvez la longue chaîne de caractères entre " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "« CLÉ DE RÉCUPÉRATION »" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " et " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "« FIN DE LA CLÉ DE RÉCUPÉRATION »" }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_recovery_email_step2 = /** @type {((inputs: Recovery_Email_Step2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Find the long string of characters between "RECOVERY KEY" and "END RECOVERY KEY"`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Find the long string of characters between " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "\"RECOVERY KEY\"" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " and " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "\"END RECOVERY KEY\"" }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Find the long string of characters between \"RECOVERY KEY\" and \"END RECOVERY KEY\"" |
*
* @param {Recovery_Email_Step2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_step2 = /** @type {((inputs?: Recovery_Email_Step2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Recovery_Email_Step2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Recovery_Email_Step2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Recovery_Email_Step2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_recovery_email_step2(inputs)
			if (locale === "es") return es_recovery_email_step2(inputs)
			if (locale === "fr") return fr_recovery_email_step2(inputs)
			return ar_recovery_email_step2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Recovery_Email_Step2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_recovery_email_step2.parts === "function" ? en_recovery_email_step2.parts(inputs) : [{ type: "text", value: en_recovery_email_step2(inputs) }]
				if (locale === "es") return typeof es_recovery_email_step2.parts === "function" ? es_recovery_email_step2.parts(inputs) : [{ type: "text", value: es_recovery_email_step2(inputs) }]
				if (locale === "fr") return typeof fr_recovery_email_step2.parts === "function" ? fr_recovery_email_step2.parts(inputs) : [{ type: "text", value: fr_recovery_email_step2(inputs) }]
				return typeof ar_recovery_email_step2.parts === "function" ? ar_recovery_email_step2.parts(inputs) : [{ type: "text", value: ar_recovery_email_step2(inputs) }]
			})
		}
	)
);
export { recovery_email_step2 as "recovery.email.step2" }