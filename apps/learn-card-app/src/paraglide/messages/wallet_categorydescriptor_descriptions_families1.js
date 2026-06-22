/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Families1Inputs */

const en_wallet_categorydescriptor_descriptions_families1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Families are connected through shared learning journeys and accomplishments. This feature helps guardians organize profiles, manage permissions, and track educational progress. With tools for switching accounts, connecting games, and monitoring engagement styles, Families fosters growth and celebrates achievements while offering insights into each member's learning path.`)
};

const es_wallet_categorydescriptor_descriptions_families1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las familias se conectan a través de recorridos de aprendizaje y logros compartidos. Esta función ayuda a los tutores a organizar perfiles, gestionar permisos y seguir el progreso educativo. Con herramientas para cambiar de cuenta, conectar juegos y supervisar los estilos de participación, Familias impulsa el crecimiento y celebra los logros, a la vez que ofrece información sobre el recorrido de aprendizaje de cada miembro.`)
};

const fr_wallet_categorydescriptor_descriptions_families1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les familles sont reliées par des parcours d'apprentissage et des réussites partagés. Cette fonctionnalité aide les responsables à organiser les profils, à gérer les autorisations et à suivre les progrès scolaires. Grâce à des outils permettant de changer de compte, de connecter des jeux et de suivre les modes d'engagement, Familles favorise la progression et célèbre les réussites, tout en offrant un aperçu du parcours d'apprentissage de chaque membre.`)
};

const ar_wallet_categorydescriptor_descriptions_families1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تترابط العائلات من خلال رحلات التعلّم والإنجازات المشتركة. تساعد هذه الميزة أولياء الأمور على تنظيم الملفات الشخصية وإدارة الأذونات وتتبّع التقدّم التعليمي. وبفضل أدوات تبديل الحسابات وربط الألعاب ومتابعة أنماط التفاعل، تعزّز ميزة العائلات النموّ وتحتفي بالإنجازات، مع تقديم رؤى حول مسار التعلّم لكل فرد.`)
};

/**
* | output |
* | --- |
* | "Families are connected through shared learning journeys and accomplishments. This feature helps guardians organize profiles, manage permissions, and track ed..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Families1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_families1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Families1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Families1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_families1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_families1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_families1(inputs)
	return ar_wallet_categorydescriptor_descriptions_families1(inputs)
});
export { wallet_categorydescriptor_descriptions_families1 as "wallet.categoryDescriptor.descriptions.families" }