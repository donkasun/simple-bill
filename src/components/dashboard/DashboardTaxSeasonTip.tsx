type DashboardTaxSeasonTipProps = {
  message: string;
};

const DashboardTaxSeasonTip = ({ message }: DashboardTaxSeasonTipProps) => {
  return (
    <section className="dashboard-tax-tip" aria-label="Tax season tip">
      <h4 className="dashboard-tax-tip__title">Tax Season Tip</h4>
      <p className="dashboard-tax-tip__body">{message}</p>
    </section>
  );
};

export default DashboardTaxSeasonTip;
