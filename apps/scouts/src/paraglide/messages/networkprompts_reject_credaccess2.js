/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Reject_Credaccess2Inputs */

const en_networkprompts_reject_credaccess2 = /** @type {((inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString) & { parts: (inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`You can still receive and share credentials with “school connect” and your ScoutPass number.`)
		}),
		{
			parts: /** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "You can still receive and share credentials with “school connect” and your " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "ScoutPass number" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const es_networkprompts_reject_credaccess2 = /** @type {((inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString) & { parts: (inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Aún puedes recibir y compartir credenciales con "school connect" y tu número de ScoutPass.`)
		}),
		{
			parts: /** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Aún puedes recibir y compartir credenciales con \"school connect\" y tu " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "número de ScoutPass" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_networkprompts_reject_credaccess2 = /** @type {((inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString) & { parts: (inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Vous pouvez toujours recevoir et partager des justificatifs via la « connexion scolaire » et votre numéro ScoutPass.`)
		}),
		{
			parts: /** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Vous pouvez toujours recevoir et partager des justificatifs via la « connexion scolaire » et votre " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "numéro ScoutPass" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_networkprompts_reject_credaccess2 = /** @type {((inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString) & { parts: (inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`لا يزال بإمكانك استلام ومشاركة المؤهلات من خلال "اتصال المدرسة" ورقم ScoutPass الخاص بك.`)
		}),
		{
			parts: /** @type {(inputs: Networkprompts_Reject_Credaccess2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لا يزال بإمكانك استلام ومشاركة المؤهلات من خلال \"اتصال المدرسة\" و" }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "رقم ScoutPass" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " الخاص بك." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "You can still receive and share credentials with “school connect” and your ScoutPass number." |
*
* @param {Networkprompts_Reject_Credaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_reject_credaccess2 = /** @type {((inputs?: Networkprompts_Reject_Credaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Networkprompts_Reject_Credaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Networkprompts_Reject_Credaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Networkprompts_Reject_Credaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_networkprompts_reject_credaccess2(inputs)
			if (locale === "es") return es_networkprompts_reject_credaccess2(inputs)
			if (locale === "fr") return fr_networkprompts_reject_credaccess2(inputs)
			return ar_networkprompts_reject_credaccess2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Networkprompts_Reject_Credaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_networkprompts_reject_credaccess2.parts === "function" ? en_networkprompts_reject_credaccess2.parts(inputs) : [{ type: "text", value: en_networkprompts_reject_credaccess2(inputs) }]
				if (locale === "es") return typeof es_networkprompts_reject_credaccess2.parts === "function" ? es_networkprompts_reject_credaccess2.parts(inputs) : [{ type: "text", value: es_networkprompts_reject_credaccess2(inputs) }]
				if (locale === "fr") return typeof fr_networkprompts_reject_credaccess2.parts === "function" ? fr_networkprompts_reject_credaccess2.parts(inputs) : [{ type: "text", value: fr_networkprompts_reject_credaccess2(inputs) }]
				return typeof ar_networkprompts_reject_credaccess2.parts === "function" ? ar_networkprompts_reject_credaccess2.parts(inputs) : [{ type: "text", value: ar_networkprompts_reject_credaccess2(inputs) }]
			})
		}
	)
);
export { networkprompts_reject_credaccess2 as "networkPrompts.reject.credAccess" }