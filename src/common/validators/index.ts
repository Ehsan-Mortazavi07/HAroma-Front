import * as Yup from 'yup';

export const getSignInSchema = (isPersian = true) =>
  Yup.object().shape({
    identifier: Yup.string().required(
      isPersian ? 'این فیلد ضروری است.' : 'This field is required.',
    ),
    password: Yup.string()
      .min(6, isPersian ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.' : 'Password must be at least 6 characters.')
      .required(isPersian ? 'وارد کردن رمز عبور ضروری است.' : 'Password is required.'),
  });

export const getSignUpSchema = (isPersian = true) =>
  Yup.object().shape({
    fullName: Yup.string().required(
      isPersian ? 'وارد کردن نام و نام خانوادگی ضروری است.' : 'Full name is required.',
    ),
    username: Yup.string().required(
      isPersian ? 'وارد کردن نام کاربری ضروری است.' : 'Username is required.',
    ),
    email: Yup.string()
      .email(isPersian ? 'فرمت ایمیل نامعتبر است.' : 'Invalid email address format.')
      .optional(),
    password: Yup.string()
      .min(6, isPersian ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.' : 'Password must be at least 6 characters.')
      .required(isPersian ? 'وارد کردن رمز عبور ضروری است.' : 'Password is required.'),
    confirmPassword: Yup.string()
      .oneOf(
        [Yup.ref('password')],
        isPersian ? 'تکرار رمز عبور با رمز عبور مطابقت ندارد.' : 'Passwords do not match.',
      )
      .required(isPersian ? 'تکرار رمز عبور ضروری است.' : 'Please confirm your password.'),
  });

export const getCheckoutSchema = (isPersian = true) =>
  Yup.object().shape({
    fullName: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (نام و نام خانوادگی تحویل‌گیرنده).' : 'Recipient full name is required.',
    ),
    phone: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (شماره تماس).' : 'Phone number is required.',
    ),
    province: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (استان).' : 'Province is required.',
    ),
    city: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (شهر).' : 'City is required.',
    ),
    postalCode: Yup.string().optional(),
    addressDetail: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (آدرس دقیق پستی).' : 'Street address detail is required.',
    ),
  });

export const getProductFormSchema = (isPersian = true) =>
  Yup.object().shape({
    title: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (عنوان محصول).' : 'Product title is required.',
    ),
    titleEn: Yup.string().optional(),
    slug: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (اسلاگ محصول).' : 'Product URL slug is required.',
    ),
    price: Yup.number()
      .positive(isPersian ? 'قیمت باید مثبت باشد.' : 'Price must be positive.')
      .required(isPersian ? 'این فیلد ضروری است (قیمت محصول).' : 'Price is required.'),
    discountPrice: Yup.number().positive().nullable().optional(),
    stockCount: Yup.number()
      .min(0, isPersian ? 'موجودی نمی‌تواند منفی باشد.' : 'Stock cannot be negative.')
      .default(10),
    description: Yup.string().required(
      isPersian ? 'این فیلد ضروری است (توضیحات کامل محصول).' : 'Product description is required.',
    ),
    descriptionEn: Yup.string().optional(),
    shortDescription: Yup.string().optional(),
    shortDescriptionEn: Yup.string().optional(),
  });

// Static fallbacks
export const signInSchema = getSignInSchema(true);
export const signUpSchema = getSignUpSchema(true);
export const checkoutSchema = getCheckoutSchema(true);
export const productFormSchema = getProductFormSchema(true);
