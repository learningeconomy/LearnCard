/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs */

const en_developerportal_credentialbuilder_preview_addimagenote4 = /** @type {((inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Note: Add an image to make your credential more visually distinctive!`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: "Note:" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " Add an image to make your credential more visually distinctive!" }])
			})
		}
	)
);

const es_developerportal_credentialbuilder_preview_addimagenote4 = /** @type {((inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Nota: ¡Añade una imagen para que tu credencial sea más distintiva visualmente!`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: "Nota:" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " ¡Añade una imagen para que tu credencial sea más distintiva visualmente!" }])
			})
		}
	)
);

const fr_developerportal_credentialbuilder_preview_addimagenote4 = /** @type {((inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Remarque : Ajoutez une image pour rendre votre crédential plus distinctif visuellement !`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: "Remarque :" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " Ajoutez une image pour rendre votre crédential plus distinctif visuellement !" }])
			})
		}
	)
);

const ar_developerportal_credentialbuilder_preview_addimagenote4 = /** @type {((inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`ملاحظة: أضف صورة لجعل اعتمادك أكثر تميزًا بصريًا!`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: "ملاحظة:" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " أضف صورة لجعل اعتمادك أكثر تميزًا بصريًا!" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Note: Add an image to make your credential more visually distinctive!" |
*
* @param {Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_preview_addimagenote4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { strong: { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_developerportal_credentialbuilder_preview_addimagenote4(inputs)
			if (locale === "es") return es_developerportal_credentialbuilder_preview_addimagenote4(inputs)
			if (locale === "fr") return fr_developerportal_credentialbuilder_preview_addimagenote4(inputs)
			return ar_developerportal_credentialbuilder_preview_addimagenote4(inputs)
		}),
		{
			parts: /** @type {(inputs?: Developerportal_Credentialbuilder_Preview_Addimagenote4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_developerportal_credentialbuilder_preview_addimagenote4.parts === "function" ? en_developerportal_credentialbuilder_preview_addimagenote4.parts(inputs) : [{ type: "text", value: en_developerportal_credentialbuilder_preview_addimagenote4(inputs) }]
				if (locale === "es") return typeof es_developerportal_credentialbuilder_preview_addimagenote4.parts === "function" ? es_developerportal_credentialbuilder_preview_addimagenote4.parts(inputs) : [{ type: "text", value: es_developerportal_credentialbuilder_preview_addimagenote4(inputs) }]
				if (locale === "fr") return typeof fr_developerportal_credentialbuilder_preview_addimagenote4.parts === "function" ? fr_developerportal_credentialbuilder_preview_addimagenote4.parts(inputs) : [{ type: "text", value: fr_developerportal_credentialbuilder_preview_addimagenote4(inputs) }]
				return typeof ar_developerportal_credentialbuilder_preview_addimagenote4.parts === "function" ? ar_developerportal_credentialbuilder_preview_addimagenote4.parts(inputs) : [{ type: "text", value: ar_developerportal_credentialbuilder_preview_addimagenote4(inputs) }]
			})
		}
	)
);
export { developerportal_credentialbuilder_preview_addimagenote4 as "developerPortal.credentialBuilder.preview.addImageNote" }