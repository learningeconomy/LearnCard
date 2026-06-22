/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Issuer_Note2Inputs */

const en_developerportal_credentialbuilder_issuer_note2 = /** @type {((inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`<span class="font-semibold text-amber-700">Note: The issuer is automatically set to your wallet's DID. Recipients can verify the credential was issued by you through this identifier.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "<span class=\"font-semibold text-amber-700\">Note:" }, { type: "markup-end", name: "span", options: {}, attributes: {} }, { type: "text", value: " The issuer is automatically set to your wallet's DID. Recipients can verify the credential was issued by you through this identifier." }])
			})
		}
	)
);

const es_developerportal_credentialbuilder_issuer_note2 = /** @type {((inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`<span class="font-semibold text-amber-700">Nota: El emisor se configura automáticamente con el DID de tu cartera. Los destinatarios pueden verificar que la credencial fue emitida por ti a través de este identificador.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "<span class=\"font-semibold text-amber-700\">Nota:" }, { type: "markup-end", name: "span", options: {}, attributes: {} }, { type: "text", value: " El emisor se configura automáticamente con el DID de tu cartera. Los destinatarios pueden verificar que la credencial fue emitida por ti a través de este identificador." }])
			})
		}
	)
);

const fr_developerportal_credentialbuilder_issuer_note2 = /** @type {((inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`<span class="font-semibold text-amber-700">Remarque : L'émetteur est automatiquement défini sur le DID de votre portefeuille. Les destinataires peuvent vérifier que le crédential a été émis par vous via cet identifiant.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "<span class=\"font-semibold text-amber-700\">Remarque :" }, { type: "markup-end", name: "span", options: {}, attributes: {} }, { type: "text", value: " L'émetteur est automatiquement défini sur le DID de votre portefeuille. Les destinataires peuvent vérifier que le crédential a été émis par vous via cet identifiant." }])
			})
		}
	)
);

const ar_developerportal_credentialbuilder_issuer_note2 = /** @type {((inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`<span class="font-semibold text-amber-700">ملاحظة: يتم تعيين المصدر تلقائيًا إلى DID محفظتك. يمكن للمستلمين التحقق من أن الاعتماد قد تم إصداره بواسطتك من خلال هذا المعرف.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Note2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "<span class=\"font-semibold text-amber-700\">ملاحظة:" }, { type: "markup-end", name: "span", options: {}, attributes: {} }, { type: "text", value: " يتم تعيين المصدر تلقائيًا إلى DID محفظتك. يمكن للمستلمين التحقق من أن الاعتماد قد تم إصداره بواسطتك من خلال هذا المعرف." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "<span class=\"font-semibold text-amber-700\">Note: The issuer is automatically set to your wallet's DID. Recipients can verify the credential was issued by you..." |
*
* @param {Developerportal_Credentialbuilder_Issuer_Note2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_issuer_note2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Issuer_Note2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Developerportal_Credentialbuilder_Issuer_Note2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Issuer_Note2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Developerportal_Credentialbuilder_Issuer_Note2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_developerportal_credentialbuilder_issuer_note2(inputs)
			if (locale === "es") return es_developerportal_credentialbuilder_issuer_note2(inputs)
			if (locale === "fr") return fr_developerportal_credentialbuilder_issuer_note2(inputs)
			return ar_developerportal_credentialbuilder_issuer_note2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Developerportal_Credentialbuilder_Issuer_Note2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_developerportal_credentialbuilder_issuer_note2.parts === "function" ? en_developerportal_credentialbuilder_issuer_note2.parts(inputs) : [{ type: "text", value: en_developerportal_credentialbuilder_issuer_note2(inputs) }]
				if (locale === "es") return typeof es_developerportal_credentialbuilder_issuer_note2.parts === "function" ? es_developerportal_credentialbuilder_issuer_note2.parts(inputs) : [{ type: "text", value: es_developerportal_credentialbuilder_issuer_note2(inputs) }]
				if (locale === "fr") return typeof fr_developerportal_credentialbuilder_issuer_note2.parts === "function" ? fr_developerportal_credentialbuilder_issuer_note2.parts(inputs) : [{ type: "text", value: fr_developerportal_credentialbuilder_issuer_note2(inputs) }]
				return typeof ar_developerportal_credentialbuilder_issuer_note2.parts === "function" ? ar_developerportal_credentialbuilder_issuer_note2.parts(inputs) : [{ type: "text", value: ar_developerportal_credentialbuilder_issuer_note2(inputs) }]
			})
		}
	)
);
export { developerportal_credentialbuilder_issuer_note2 as "developerPortal.credentialBuilder.issuer.note" }