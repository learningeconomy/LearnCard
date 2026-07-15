/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Recovery_Email_Descwithemail2Inputs */

const en_recovery_email_descwithemail2 = /** @type {((inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`We previously sent a recovery email to ${i?.email}. Open that email and follow the steps below.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "We previously sent a recovery email to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Open that email and follow the steps below." }])
			})
		}
	)
);

const es_recovery_email_descwithemail2 = /** @type {((inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Anteriormente enviamos un correo de recuperación a ${i?.email}. Abre ese correo y sigue los pasos a continuación.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Anteriormente enviamos un correo de recuperación a " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Abre ese correo y sigue los pasos a continuación." }])
			})
		}
	)
);

const fr_recovery_email_descwithemail2 = /** @type {((inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Nous avons précédemment envoyé un e-mail de récupération à ${i?.email}. Ouvrez cet e-mail et suivez les étapes ci-dessous.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Nous avons précédemment envoyé un e-mail de récupération à " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Ouvrez cet e-mail et suivez les étapes ci-dessous." }])
			})
		}
	)
);

const ar_recovery_email_descwithemail2 = /** @type {((inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`لقد أرسلنا سابقاً بريداً إلكترونياً لاستعادة الحساب إلى ${i?.email}. افتح ذلك البريد واتبع الخطوات أدناه.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Descwithemail2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لقد أرسلنا سابقاً بريداً إلكترونياً لاستعادة الحساب إلى " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". افتح ذلك البريد واتبع الخطوات أدناه." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "We previously sent a recovery email to {email}. Open that email and follow the steps below." |
*
* @param {Recovery_Email_Descwithemail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_descwithemail2 = /** @type {((inputs: Recovery_Email_Descwithemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Recovery_Email_Descwithemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Recovery_Email_Descwithemail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Descwithemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_recovery_email_descwithemail2(inputs)
			if (locale === "es") return es_recovery_email_descwithemail2(inputs)
			if (locale === "fr") return fr_recovery_email_descwithemail2(inputs)
			return ar_recovery_email_descwithemail2(inputs)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Descwithemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_recovery_email_descwithemail2.parts === "function" ? en_recovery_email_descwithemail2.parts(inputs) : [{ type: "text", value: en_recovery_email_descwithemail2(inputs) }]
				if (locale === "es") return typeof es_recovery_email_descwithemail2.parts === "function" ? es_recovery_email_descwithemail2.parts(inputs) : [{ type: "text", value: es_recovery_email_descwithemail2(inputs) }]
				if (locale === "fr") return typeof fr_recovery_email_descwithemail2.parts === "function" ? fr_recovery_email_descwithemail2.parts(inputs) : [{ type: "text", value: fr_recovery_email_descwithemail2(inputs) }]
				return typeof ar_recovery_email_descwithemail2.parts === "function" ? ar_recovery_email_descwithemail2.parts(inputs) : [{ type: "text", value: ar_recovery_email_descwithemail2(inputs) }]
			})
		}
	)
);
export { recovery_email_descwithemail2 as "recovery.email.descWithEmail" }