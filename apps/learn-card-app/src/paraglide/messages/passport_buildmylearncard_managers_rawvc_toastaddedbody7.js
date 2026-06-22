/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs */

const en_passport_buildmylearncard_managers_rawvc_toastaddedbody7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your journey is now reflected in portable, trusted credentials.`)
};

const es_passport_buildmylearncard_managers_rawvc_toastaddedbody7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu trayectoria ahora se refleja en credenciales portátiles y confiables.`)
};

const fr_passport_buildmylearncard_managers_rawvc_toastaddedbody7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre parcours est désormais reflété dans des credentials portables et fiables.`)
};

const ar_passport_buildmylearncard_managers_rawvc_toastaddedbody7 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أصبحت مسيرتك الآن منعكسة في شهادات اعتماد محمولة وموثوقة.`)
};

/**
* | output |
* | --- |
* | "Your journey is now reflected in portable, trusted credentials." |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_toastaddedbody7 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Toastaddedbody7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_toastaddedbody7(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_toastaddedbody7(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_toastaddedbody7(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_toastaddedbody7(inputs)
});
export { passport_buildmylearncard_managers_rawvc_toastaddedbody7 as "passport.buildMyLearnCard.managers.rawVC.toastAddedBody" }