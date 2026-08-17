/**
 * Laravel/PHP only parses multipart bodies on POST requests, so file-upload
 * endpoints are called via POST with a _method=PUT/PATCH override field
 * rather than a native axios PUT/PATCH with a multipart body.
 */
export function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File) {
          formData.append(`${key}[${index}]`, item);
        } else if (typeof item === 'object') {
          Object.entries(item).forEach(([subKey, subValue]) => {
            formData.append(`${key}[${index}][${subKey}]`, subValue);
          });
        } else {
          formData.append(`${key}[${index}]`, item);
        }
      });
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
  });

  return formData;
}
