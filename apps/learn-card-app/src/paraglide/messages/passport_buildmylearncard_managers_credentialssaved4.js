/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Passport_Buildmylearncard_Managers_Credentialssaved4Inputs */

const en_passport_buildmylearncard_managers_credentialssaved4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Credentialssaved4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credential(s) saved to your wallet.`)
};

const es_passport_buildmylearncard_managers_credentialssaved4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Credentialssaved4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credencial(es) guardada(s) en tu cartera.`)
};

const fr_passport_buildmylearncard_managers_credentialssaved4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Credentialssaved4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credential(s) enregistré(s) dans votre portefeuille.`)
};

const ar_passport_buildmylearncard_managers_credentialssaved4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Credentialssaved4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم حفظ ${i?.count} شهادة/شهادات في محفظتك.`)
};

/**
* | output |
* | --- |
* | "{count} credential(s) saved to your wallet." |
*
* @param {Passport_Buildmylearncard_Managers_Credentialssaved4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_credentialssaved4 = /** @type {((inputs: Passport_Buildmylearncard_Managers_Credentialssaved4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Credentialssaved4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_credentialssaved4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_credentialssaved4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_credentialssaved4(inputs)
	return ar_passport_buildmylearncard_managers_credentialssaved4(inputs)
});
export { passport_buildmylearncard_managers_credentialssaved4 as "passport.buildMyLearnCard.managers.credentialsSaved" }