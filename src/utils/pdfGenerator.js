import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSpecialityBadge } from '../state.js';

export function generateReport(state) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Branding Colors
  const primaryColor = state.theme === 'light' ? [15, 23, 42] : [99, 102, 241];
  const secondaryColor = [245, 158, 11]; // Gold
  const teamAColor = [59, 130, 246];
  const teamBColor = [249, 115, 22];

  // ===== HEADER =====
  doc.setFillColor(15, 23, 42); // Always dark header for professional look
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('ADANI DIGITAL PREMIER LEAGUE', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('OFFICIAL AUCTION REPORT', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }), pageWidth / 2, 38, { align: 'center' });

  // ===== TEAM ROSTERS SECTION =====
  let currentY = 55;
  
  const teamA = state.teams[0];
  const teamB = state.teams[1];

  // Function to prepare team data for table
  const getTeamRows = (team) => {
    const rows = [];
    // Captain first
    if (team.captain) {
      const cap = state.players.find(p => p.id === team.captain);
      if (cap) {
        rows.push([{ content: `${cap.name} (CAP)`, styles: { fontStyle: 'bold', textColor: secondaryColor } }, { content: 'CAPTAIN', styles: { fontStyle: 'bold', textColor: secondaryColor } }]);
      }
    }
    // Roster
    team.roster.forEach(entry => {
      const p = state.players.find(pl => pl.id === entry.playerId);
      if (p && p.id !== team.captain) {
        rows.push([`${p.name} (${getSpecialityBadge(p.speciality)})`, `Rs. ${entry.price}`]);
      }
    });
    
    // Fill empty rows if needed to align heights? No, autotable handles it.
    return rows;
  };

  // Draw Team A Table
  autoTable(doc, {
    head: [[{ content: teamA.name || 'TEAM 1', colSpan: 2, styles: { halign: 'center', fillColor: teamAColor } }]],
    body: getTeamRows(teamA),
    startY: currentY,
    margin: { left: 15, right: pageWidth / 2 + 5 },
    theme: 'striped',
    headStyles: { fontSize: 12, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
  });

  // Draw Team B Table (Side by Side)
  autoTable(doc, {
    head: [[{ content: teamB.name || 'TEAM 2', colSpan: 2, styles: { halign: 'center', fillColor: teamBColor } }]],
    body: getTeamRows(teamB),
    startY: currentY,
    margin: { left: pageWidth / 2 + 5, right: 15 },
    theme: 'striped',
    headStyles: { fontSize: 12, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
  });

  // ===== INFOGRAPHIC TIMELINE =====
  doc.addPage();
  currentY = 20;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('AUCTION FLOW INFOGRAPHIC', pageWidth / 2, 16, { align: 'center' });

  currentY = 40;
  
  state.auctionLog.forEach((event, index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    // Draw Event Container
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 20, currentY + 30); // Timeline vertical line
    
    // Event node circle
    doc.setFillColor(...primaryColor);
    doc.circle(20, currentY, 3, 'F');
    
    // Content box
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(30, currentY - 5, pageWidth - 50, 25, 2, 2, 'FD');
    
    // Player Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${event.playerName} (${getSpecialityBadge(event.speciality)})`, 35, currentY + 3);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Base: Rs. ${state.basePrice}`, 35, currentY + 10);

    // Flow path logic
    if (event.finalPrice) {
      const winnerColor = event.wonBy === teamA.name ? teamAColor : teamBColor;
      doc.setTextColor(...winnerColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`SOLD TO: ${event.wonBy}`, pageWidth - 35, currentY + 3, { align: 'right' });
      
      doc.setFontSize(14);
      doc.text(`Rs. ${event.finalPrice}`, pageWidth - 35, currentY + 12, { align: 'right' });
      
      // Bidding steps visualization
      let bidX = 35;
      event.bids.slice(-5).forEach((bid, i) => { // show last 5 bids
        const bColor = bid.team === teamA.name ? teamAColor : teamBColor;
        doc.setFillColor(...bColor);
        doc.roundedRect(bidX, currentY + 13, 20, 5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(`Rs. ${bid.amount}`, bidX + 10, currentY + 16.5, { align: 'center' });
        bidX += 22;
      });
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('UNSOLD', pageWidth - 35, currentY + 8, { align: 'right' });
    }

    currentY += 35;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`ADANI DIGITAL PREMIER LEAGUE - CONFIDENTIAL REPORT`, 15, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  doc.save('ADPL_Auction_Report.pdf');
}
