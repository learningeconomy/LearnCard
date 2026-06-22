/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, brand: NonNullable<unknown> }} Datasharing_Revokeconfirm_Body2Inputs */

const en_datasharing_revokeconfirm_body2 = /** @type {((inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString) & { parts: (inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} will no longer be able to access your ${i?.brand} data.`)
		}),
		{
			parts: /** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " will no longer be able to access your " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " data." }])
			})
		}
	)
);

const es_datasharing_revokeconfirm_body2 = /** @type {((inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString) & { parts: (inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} ya no podrá acceder a tus datos de ${i?.brand}.`)
		}),
		{
			parts: /** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ya no podrá acceder a tus datos de " }, { type: "text", value: String(i?.brand) }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_datasharing_revokeconfirm_body2 = /** @type {((inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString) & { parts: (inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.name} ne pourra plus accéder à vos données ${i?.brand}.`)
		}),
		{
			parts: /** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ne pourra plus accéder à vos données " }, { type: "text", value: String(i?.brand) }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_datasharing_revokeconfirm_body2 = /** @type {((inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString) & { parts: (inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`لن يتمكن ${i?.name} بعد الآن من الوصول إلى بيانات ${i?.brand} الخاصة بك.`)
		}),
		{
			parts: /** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لن يتمكن " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " بعد الآن من الوصول إلى بيانات " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " الخاصة بك." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "{name} will no longer be able to access your {brand} data." |
*
* @param {Datasharing_Revokeconfirm_Body2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_revokeconfirm_body2 = /** @type {((inputs: Datasharing_Revokeconfirm_Body2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Datasharing_Revokeconfirm_Body2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Datasharing_Revokeconfirm_Body2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_datasharing_revokeconfirm_body2(inputs)
			if (locale === "es") return es_datasharing_revokeconfirm_body2(inputs)
			if (locale === "fr") return fr_datasharing_revokeconfirm_body2(inputs)
			return ar_datasharing_revokeconfirm_body2(inputs)
		}),
		{
			parts: /** @type {(inputs: Datasharing_Revokeconfirm_Body2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_datasharing_revokeconfirm_body2.parts === "function" ? en_datasharing_revokeconfirm_body2.parts(inputs) : [{ type: "text", value: en_datasharing_revokeconfirm_body2(inputs) }]
				if (locale === "es") return typeof es_datasharing_revokeconfirm_body2.parts === "function" ? es_datasharing_revokeconfirm_body2.parts(inputs) : [{ type: "text", value: es_datasharing_revokeconfirm_body2(inputs) }]
				if (locale === "fr") return typeof fr_datasharing_revokeconfirm_body2.parts === "function" ? fr_datasharing_revokeconfirm_body2.parts(inputs) : [{ type: "text", value: fr_datasharing_revokeconfirm_body2(inputs) }]
				return typeof ar_datasharing_revokeconfirm_body2.parts === "function" ? ar_datasharing_revokeconfirm_body2.parts(inputs) : [{ type: "text", value: ar_datasharing_revokeconfirm_body2(inputs) }]
			})
		}
	)
);
export { datasharing_revokeconfirm_body2 as "dataSharing.revokeConfirm.body" }