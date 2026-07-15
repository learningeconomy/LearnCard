/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Skillframeworks_Confirmdeltier3Inputs */

const en_skillframeworks_confirmdeltier3 = /** @type {((inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Please confirm deletion of this framework tier and everything inside it including ${i?.count} skill/skills.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Please confirm deletion of this framework tier and everything inside it including " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " skill/skills." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_skillframeworks_confirmdeltier3 = /** @type {((inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Confirma la eliminación de este nivel del marco y todo lo que contiene, incluyendo ${i?.count} habilidad/habilidades.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Confirma la eliminación de este nivel del marco y todo lo que contiene, incluyendo " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " habilidad/habilidades." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_skillframeworks_confirmdeltier3 = /** @type {((inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Veuillez confirmer la suppression de ce niveau de cadre et tout son contenu, y compris ${i?.count} compétence(s).`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Veuillez confirmer la suppression de ce niveau de cadre et tout son contenu, y compris " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " compétence(s)." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_skillframeworks_confirmdeltier3 = /** @type {((inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString) & { parts: (inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Please confirm deletion of this framework tier and everything inside it including ${i?.count} skill/skills.`)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Please confirm deletion of this framework tier and everything inside it including " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.count) }, { type: "text", value: " skill/skills." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Please confirm deletion of this framework tier and everything inside it including {count} skill/skills." |
*
* @param {Skillframeworks_Confirmdeltier3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_confirmdeltier3 = /** @type {((inputs: Skillframeworks_Confirmdeltier3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Skillframeworks_Confirmdeltier3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skillframeworks_Confirmdeltier3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skillframeworks_confirmdeltier3(inputs)
			if (locale === "es") return es_skillframeworks_confirmdeltier3(inputs)
			if (locale === "fr") return fr_skillframeworks_confirmdeltier3(inputs)
			return ar_skillframeworks_confirmdeltier3(inputs)
		}),
		{
			parts: /** @type {(inputs: Skillframeworks_Confirmdeltier3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skillframeworks_confirmdeltier3.parts === "function" ? en_skillframeworks_confirmdeltier3.parts(inputs) : [{ type: "text", value: en_skillframeworks_confirmdeltier3(inputs) }]
				if (locale === "es") return typeof es_skillframeworks_confirmdeltier3.parts === "function" ? es_skillframeworks_confirmdeltier3.parts(inputs) : [{ type: "text", value: es_skillframeworks_confirmdeltier3(inputs) }]
				if (locale === "fr") return typeof fr_skillframeworks_confirmdeltier3.parts === "function" ? fr_skillframeworks_confirmdeltier3.parts(inputs) : [{ type: "text", value: fr_skillframeworks_confirmdeltier3(inputs) }]
				return typeof ar_skillframeworks_confirmdeltier3.parts === "function" ? ar_skillframeworks_confirmdeltier3.parts(inputs) : [{ type: "text", value: ar_skillframeworks_confirmdeltier3(inputs) }]
			})
		}
	)
);
export { skillframeworks_confirmdeltier3 as "skillFrameworks.confirmDelTier" }