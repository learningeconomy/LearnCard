/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ itemType: NonNullable<unknown> }} Recoveryprompt_Body1Inputs */

const en_recoveryprompt_body1 = /** @type {(inputs: Recoveryprompt_Body1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`We found a ${i?.itemType} with unsaved changes. Would you like to continue where you left off?`)
};

const es_recoveryprompt_body1 = /** @type {(inputs: Recoveryprompt_Body1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Encontramos un ${i?.itemType} con cambios sin guardar. ¿Quieres continuar donde lo dejaste?`)
};

const fr_recoveryprompt_body1 = /** @type {(inputs: Recoveryprompt_Body1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nous avons trouvé un ${i?.itemType} avec des modifications non enregistrées. Voulez-vous reprendre là où vous vous êtes arrêté ?`)
};

const ar_recoveryprompt_body1 = /** @type {(inputs: Recoveryprompt_Body1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`وجدنا ${i?.itemType} يحتوي على تغييرات غير محفوظة. هل تريد المتابعة من حيث توقفت؟`)
};

/**
* | output |
* | --- |
* | "We found a {itemType} with unsaved changes. Would you like to continue where you left off?" |
*
* @param {Recoveryprompt_Body1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recoveryprompt_body1 = /** @type {((inputs: Recoveryprompt_Body1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recoveryprompt_Body1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recoveryprompt_body1(inputs)
	if (locale === "es") return es_recoveryprompt_body1(inputs)
	if (locale === "fr") return fr_recoveryprompt_body1(inputs)
	return ar_recoveryprompt_body1(inputs)
});
export { recoveryprompt_body1 as "recoveryPrompt.body" }