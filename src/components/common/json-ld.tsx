/**
 * Yapılandırılmış veri (schema.org) çıktısı. "<" karakteri kaçırılarak
 * JSON içeriğinin script etiketini kapatması engellenir.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
