/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Appinstall_Installapp2Inputs */

const en_appinstall_installapp2 = /** @type {((inputs: Appinstall_Installapp2Inputs) => LocalizedString) & { parts: (inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Appinstall_Installapp2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Install ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Install " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "?" }])
			})
		}
	)
);

const es_appinstall_installapp2 = /** @type {((inputs: Appinstall_Installapp2Inputs) => LocalizedString) & { parts: (inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Appinstall_Installapp2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`¿Instalar ${i?.name}?`)
		}),
		{
			parts: /** @type {(inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "¿Instalar " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "?" }])
			})
		}
	)
);

const fr_appinstall_installapp2 = /** @type {((inputs: Appinstall_Installapp2Inputs) => LocalizedString) & { parts: (inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Appinstall_Installapp2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Installer ${i?.name} ?`)
		}),
		{
			parts: /** @type {(inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Installer " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ?" }])
			})
		}
	)
);

const ar_appinstall_installapp2 = /** @type {((inputs: Appinstall_Installapp2Inputs) => LocalizedString) & { parts: (inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Appinstall_Installapp2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`تثبيت ${i?.name}؟`)
		}),
		{
			parts: /** @type {(inputs: Appinstall_Installapp2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "تثبيت " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "؟" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Install {name}?" |
*
* @param {Appinstall_Installapp2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_installapp2 = /** @type {((inputs: Appinstall_Installapp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Appinstall_Installapp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Appinstall_Installapp2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Appinstall_Installapp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_appinstall_installapp2(inputs)
			if (locale === "es") return es_appinstall_installapp2(inputs)
			if (locale === "fr") return fr_appinstall_installapp2(inputs)
			return ar_appinstall_installapp2(inputs)
		}),
		{
			parts: /** @type {(inputs: Appinstall_Installapp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_appinstall_installapp2.parts === "function" ? en_appinstall_installapp2.parts(inputs) : [{ type: "text", value: en_appinstall_installapp2(inputs) }]
				if (locale === "es") return typeof es_appinstall_installapp2.parts === "function" ? es_appinstall_installapp2.parts(inputs) : [{ type: "text", value: es_appinstall_installapp2(inputs) }]
				if (locale === "fr") return typeof fr_appinstall_installapp2.parts === "function" ? fr_appinstall_installapp2.parts(inputs) : [{ type: "text", value: fr_appinstall_installapp2(inputs) }]
				return typeof ar_appinstall_installapp2.parts === "function" ? ar_appinstall_installapp2.parts(inputs) : [{ type: "text", value: ar_appinstall_installapp2(inputs) }]
			})
		}
	)
);
export { appinstall_installapp2 as "appInstall.installApp" }