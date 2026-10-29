export async function downloadInvoice(invoice, order, company) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.setTextColor(210, 220, 220);
  pdf.setFontSize(48);
  pdf.text("DEMO / NOT FISCAL", 25, 160, { angle: 35 });
  pdf.setTextColor(22, 47, 60);
  pdf.setFontSize(25);
  pdf.text("TradeHub | SAMPLE INVOICE", 20, 25);
  pdf.setFontSize(11);
  pdf.text(
    [
      invoice.number,
      company.name,
      `Order: ${order.number}`,
      `Date: ${new Date(invoice.date).toLocaleDateString("de-DE")}`,
    ],
    20,
    40,
  );
  let y = 72;
  order.items.forEach((i) => {
    if (y > 250) {
      pdf.addPage();
      y = 25;
      pdf.setTextColor(190);
      pdf.text("DEMO / NOT FISCAL", 20, 280);
      pdf.setTextColor(22, 47, 60);
    }
    pdf.text(
      `${i.sku}  ${i.name.slice(0, 28)}  x${i.qty}   EUR ${(i.unitPrice * i.qty).toFixed(2)}`,
      20,
      y,
    );
    y += 9;
  });
  if (y > 235) {
    pdf.addPage();
    y = 25;
  }
  pdf.text(
    `Illustrative net total: EUR ${invoice.amount.toFixed(2)}`,
    20,
    y + 12,
  );
  pdf.text(
    [
      "DEMO DOCUMENT - NOT A FISCAL INVOICE",
      "VAT and shipping are not calculated.",
      "Production invoices must originate from Odoo ERP.",
    ],
    20,
    y + 27,
  );
  pdf.save(invoice.number + ".pdf");
}
