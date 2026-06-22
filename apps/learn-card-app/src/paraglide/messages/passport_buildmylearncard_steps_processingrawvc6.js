/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Processingrawvc6Inputs */

const en_passport_buildmylearncard_steps_processingrawvc6 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingrawvc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing Raw VC…`)
};

const es_passport_buildmylearncard_steps_processingrawvc6 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingrawvc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procesando credencial…`)
};

const fr_passport_buildmylearncard_steps_processingrawvc6 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingrawvc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement de la référence…`)
};

const ar_passport_buildmylearncard_steps_processingrawvc6 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingrawvc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ معالجة الاعتماد…`)
};

/**
* | output |
* | --- |
* | "Processing Raw VC…" |
*
* @param {Passport_Buildmylearncard_Steps_Processingrawvc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_processingrawvc6 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Processingrawvc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Processingrawvc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_processingrawvc6(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_processingrawvc6(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_processingrawvc6(inputs)
	return ar_passport_buildmylearncard_steps_processingrawvc6(inputs)
});
export { passport_buildmylearncard_steps_processingrawvc6 as "passport.buildMyLearnCard.steps.processingRawVC" }