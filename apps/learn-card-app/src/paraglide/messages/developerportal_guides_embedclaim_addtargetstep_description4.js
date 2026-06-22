/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs */

const en_developerportal_guides_embedclaim_addtargetstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a container element to your page where the "Claim Credential" button will appear.`)
};

const es_developerportal_guides_embedclaim_addtargetstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade un elemento contenedor a tu página donde aparecerá el botón "Reclamar Credencial".`)
};

const fr_developerportal_guides_embedclaim_addtargetstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un élément conteneur à votre page où le bouton « Réclamer un Certificat » apparaîtra.`)
};

const ar_developerportal_guides_embedclaim_addtargetstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف عنصر حاوية إلى صفحتك حيث سيظهر زر "المطالبة بالمؤهل".`)
};

/**
* | output |
* | --- |
* | "Add a container element to your page where the \"Claim Credential\" button will appear." |
*
* @param {Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_addtargetstep_description4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Addtargetstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_addtargetstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_addtargetstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_addtargetstep_description4(inputs)
	return ar_developerportal_guides_embedclaim_addtargetstep_description4(inputs)
});
export { developerportal_guides_embedclaim_addtargetstep_description4 as "developerPortal.guides.embedClaim.addTargetStep.description" }